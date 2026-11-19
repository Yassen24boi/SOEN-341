const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// Allow 30 seconds for cloud database operations
jest.setTimeout(30000);

const RUN_ID = Date.now();
const APP_CITY = `AppCity-${RUN_ID}`;

function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('CareerConnect Job Application Tests', () => {
    let recruiter;
    let jobSeeker;
    let seekerToken;
    let openJob;
    let closedJob;
    let expiredJob;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }

        recruiter = await User.create({
            fullName: 'App Recruiter',
            email: `recruiter_app_${RUN_ID}@example.com`,
            password: 'password123',
            role: 'recruiter'
        });
        
        jobSeeker = await User.create({
            fullName: 'App Seeker',
            email: `seeker_app_${RUN_ID}@example.com`,
            password: 'password123',
            role: 'jobseeker',
            resumes: [
                { filename: 'resume1.pdf', label: 'Primary CV', isDefault: true }
            ]
        });

        const secret = process.env.JWT_SECRET || 'secret_key';
        seekerToken = jwt.sign({ userId: jobSeeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });

        openJob = await Job.create({
            recruiter: recruiter._id,
            company: 'Test Company',
            title: 'Application Test Job',
            location: APP_CITY,
            description: 'Open job for applications.',
            status: 'open'
        });

        closedJob = await Job.create({
            recruiter: recruiter._id,
            company: 'Test Company',
            title: 'Closed Application Job',
            location: APP_CITY,
            description: 'Closed job.',
            status: 'closed'
        });

        expiredJob = await Job.create({
            recruiter: recruiter._id,
            company: 'Test Company',
            title: 'Expired Application Job',
            location: APP_CITY,
            description: 'Expired job.',
            status: 'open',
            deadline: daysFromNow(-1)
        });
    });

    afterAll(async () => {
        const testUsers = await User.find({
            email: { $in: [
                            `recruiter_app_${RUN_ID}@example.com`,
                            `other_recruiter_app_${RUN_ID}@example.com`, 
                            `seeker_app_${RUN_ID}@example.com`, 
                            `seeker2_app_${RUN_ID}@example.com`, 
                            `stats_app_${RUN_ID}@example.com`, 
                            `activity_app_${RUN_ID}@example.com`] }
        });
        const testUserIds = testUsers.map((user) => user._id);
        await Application.deleteMany({ applicant: { $in: testUserIds } });
        await Job.deleteMany({ recruiter: { $in: testUserIds } });
        await User.deleteMany({ _id: { $in: testUserIds } });
        await Notification.deleteMany({recipient: {$in: testUserIds}});
        await mongoose.connection.close();
    });

    describe('POST /api/jobs/:id/apply - Job Application Workflow (US-12)', () => {
        it('AT-12.1: should successfully save an application with resumeFilename and status when applying to an open job', async () => {
            const res = await request(app)
                .post(`/api/jobs/${openJob._id}/apply`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ resumeFilename: 'resume1.pdf' });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.resumeFilename).toEqual('resume1.pdf');

            const savedApp = await Application.findOne({ job: openJob._id, applicant: jobSeeker._id });
            expect(savedApp).not.toBeNull();
            expect(savedApp.resumeFilename).toEqual('resume1.pdf');
        });

        it('AT-12.3: should reject duplicate applications with status 409 and "Already applied"', async () => {
            const res = await request(app)
                .post(`/api/jobs/${openJob._id}/apply`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ resumeFilename: 'resume1.pdf' });

            expect(res.statusCode).toEqual(409);
            expect(res.body.message).toEqual('Already applied');
        });

        it('Task 12.4: should block applying when the job is closed', async () => {
            const res = await request(app)
                .post(`/api/jobs/${closedJob._id}/apply`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ resumeFilename: 'resume1.pdf' });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Job not available');
        });

        it('Task 12.4: should block applying when the job deadline has passed', async () => {
            const res = await request(app)
                .post(`/api/jobs/${expiredJob._id}/apply`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ resumeFilename: 'resume1.pdf' });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Job not available');
        });

        it('AT-13.1: should return the created application with ID, job title, and date from apply endpoint', async () => {
            const uniqueJob = await Job.create({
                recruiter: recruiter._id,
                company: 'Test Company',
                title: 'Confirmation Test Job',
                localtion: APP_CITY,
                description: 'Job for AT-13.1 test.',
                status: 'open'
            });
            
            
            const res = await request(app)
                .post(`/api/jobs/${uniqueJob._id}/apply`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ resumeFilename: 'resume1.pdf' });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('jobTitle', 'Confirmation Test Job');
            expect(res.body).toHaveProperty('createdAt');
        });
    });

    describe('GET /api/applications/me & PATCH /api/applications/:id/status - Status Tracking & Isolation (US-14)', () => {
        let secondSeeker;
        let secondSeekerToken;
        let recruiterToken;
        let otherRecruiter;
        let otherRecruiterToken;
        let seekerApp;
        let reviewJob;
        let reviewApp;
        let statsSeeker;
        let statsToken;
        let activitySeeker;
        let activityToken;

        beforeAll(async () => {
            const secret = process.env.JWT_SECRET || 'secret_key';

            // Token for existing recruiter
            recruiterToken = jwt.sign({ userId: recruiter._id, role: 'recruiter' }, secret, { expiresIn: '1h' });

            // Create second seeker to verify user isolation
            secondSeeker = await User.create({
                fullName: 'Second Seeker',
                email: `seeker2_app_${RUN_ID}@example.com`,
                password: 'password123',
                role: 'jobseeker'
            });
            secondSeekerToken = jwt.sign({ userId: secondSeeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });

            statsSeeker = await User.create({
                fullName: 'Stats Seeker',
                email: `stats_app_${RUN_ID}@example.com`,
                password: 'password123',
                role: 'jobseeker'
            });
            statsToken = jwt.sign({ userId: statsSeeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });

            activitySeeker = await User.create({
                fullName: 'Activity Seeker',
                email: `activity_app_${RUN_ID}@example.com`,
                password: 'password123',
                role: 'jobseeker'
            });
            activityToken = jwt.sign({ userId: activitySeeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });

            const now = new Date();
            const currentWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            currentWeek.setUTCDate(currentWeek.getUTCDate() - ((currentWeek.getUTCDay() + 6) % 7));
            const activityDates = [
                ...Array.from({ length: 3 }, () => now),
                ...Array.from({ length: 2 }, () => new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000)),
                ...Array.from({ length: 5 }, (_, index) => new Date(currentWeek.getTime() - (index + 2) * 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000))
            ];
            const activityJobs = await Job.insertMany(activityDates.map((_, index) => ({
                recruiter: recruiter._id,
                company: `Activity Company ${index}`,
                title: `Activity Job ${index}`,
                location: APP_CITY,
                description: 'Application activity test job.',
                status: 'open'
            })));
            await Application.insertMany(activityDates.map((createdAt, index) => ({
                job: activityJobs[index]._id,
                applicant: activitySeeker._id,
                status: index < 8 ? 'Applied' : 'Interview',
                createdAt
            })));

            const statuses = [
                'Applied', 'Applied', 'Applied', 'Applied',
                'Under Review', 'Interview', 'Interview', 'Rejected', 'Withdrawn'
            ];
            const statsJobs = await Job.insertMany(statuses.map((_, index) => ({
                recruiter: recruiter._id,
                company: `Stats Company ${index}`,
                title: `Stats Job ${index}`,
                location: APP_CITY,
                description: 'Application statistics test job.',
                status: 'open'
            })));
            await Application.insertMany(statuses.map((status, index) => ({
                job: statsJobs[index]._id,
                applicant: statsSeeker._id,
                status
            })));

            // Fetch an existing application created by jobSeeker in earlier tests
            seekerApp = await Application.findOne({ applicant: jobSeeker._id });
        });

        it('Task 26.1/26.4: returns per-status counts, pending totals, and withdrawn applications', async () => {
            const res = await request(app)
                .get('/api/applications/me/stats')
                .set('Authorization', `Bearer ${statsToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({
                total: 9,
                pending: 5,
                statuses: {
                    Applied: 4,
                    'Under Review': 1,
                    Interview: 2,
                    Offered: 0,
                    Rejected: 1,
                    Withdrawn: 1
                },
                weeklyApplications: expect.any(Array),
                responseRate: expect.any(Number)
            });
        });

        it('Task 27.1/27.4: groups the last 12 weeks and calculates response rate', async () => {
            const res = await request(app)
                .get('/api/applications/me/stats')
                .set('Authorization', `Bearer ${activityToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.weeklyApplications).toHaveLength(12);
            expect(res.body.weeklyApplications.slice(-2).map((week) => week.count)).toEqual([2, 3]);
            expect(res.body.responseRate).toEqual(20);
        });

        it('Task 26.1: returns zero counts for a seeker with no applications', async () => {
            const res = await request(app)
                .get('/api/applications/me/stats')
                .set('Authorization', `Bearer ${secondSeekerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.total).toEqual(0);
            expect(res.body.pending).toEqual(0);
            expect(Object.values(res.body.statuses).every((count) => count === 0)).toBe(true);
        });

        it('Task 26.1: counts only the authenticated job seeker applications', async () => {
            const res = await request(app)
                .get('/api/applications/me/stats')
                .set('Authorization', `Bearer ${seekerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.total).toEqual(await Application.countDocuments({ applicant: jobSeeker._id }));
            expect(res.body.total).not.toEqual(9);
        });

        it('AT-14.1 / Task 14.2: should return only the logged-in seeker applications with populated job details', async () => {
            const res = await request(app)
                .get('/api/applications')
                .set('Authorization', `Bearer ${seekerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);

            // Task 14.5: Ensure all returned applications belong ONLY to the logged-in seeker
            res.body.forEach((appItem) => {
                const applicantId = appItem.applicant._id || appItem.applicant;
                expect(applicantId.toString()).toEqual(jobSeeker._id.toString());
                expect(appItem).toHaveProperty('job');
                expect(appItem.job).toHaveProperty('title');
                expect(appItem.job).toHaveProperty('company');
                expect(appItem).toHaveProperty('status');
                expect(appItem).toHaveProperty('createdAt');
            });
        });

        it('Task 14.5: should return an empty list for a seeker with no applications', async () => {
            const res = await request(app)
                .get('/api/applications')
                .set('Authorization', `Bearer ${secondSeekerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });

        it('AT-14.2: should allow recruiter to update application status to "Interview"', async () => {
            const res = await request(app)
                .patch(`/api/applications/${seekerApp._id}/status`)
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send({ status: 'Interview' });

            expect(res.statusCode).toEqual(200);

            // Verify status persisted in database
            const updatedApp = await Application.findById(seekerApp._id);
            expect(updatedApp.status).toEqual('Interview');
        });

        it('Task 14.1: should reject invalid status values with status 400', async () => {
            const res = await request(app)
                .patch(`/api/applications/${seekerApp._id}/status`)
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send({ status: 'InvalidStatus' });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toEqual('Invalid status value provided.');
        });

        it('Task 14.3 / Withdrawal: should allow seeker to update their own application status to "Withdrawn"', async () => {
            const res = await request(app)
                .patch(`/api/applications/${seekerApp._id}/withdraw`)
                .set('Authorization', `Bearer ${seekerToken}`)

            expect(res.statusCode).toEqual(200);

            const updatedApp = await Application.findById(seekerApp._id);
            expect(updatedApp.status).toEqual('Withdrawn');
        });

        it('Task 14.5: should block seekers from setting unauthorized status values like "Interview"', async () => {
            const res = await request(app)
                .patch(`/api/applications/${seekerApp._id}/status`)
                .set('Authorization', `Bearer ${seekerToken}`)
                .send({ status: 'Interview' });

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Applicants can only update their application status to Withdrawn.');
        });
    });

    describe('GET /api/applications/:id - Candidate Application Review (US-23)', () => {
        let us23RecruiterToken;
        let us23OtherRecruiterToken;
        let us23ReviewApp;

        beforeAll(async () => {
            const secret = process.env.JWT_SECRET || 'secret_key';

            us23RecruiterToken = jwt.sign(
                { userId: recruiter._id, role: 'recruiter' },
                secret,
                { expiresIn: '1h' }
            );

            const otherRecruiter = await User.create({
                fullName: 'Other Recruiter',
                email: `other_recruiter_app_${RUN_ID}@example.com`,
                password: 'password123',
                role: 'recruiter'
            });
            us23OtherRecruiterToken = jwt.sign(
                { userId: otherRecruiter._id, role: 'recruiter' },
                secret,
                { expiresIn: '1h' }
            );

            const reviewJob = await Job.create({
                recruiter: recruiter._id,
                company: 'Test Company',
                title: 'Senior Developer Review Job',
                location: APP_CITY,
                description: 'Job for US-23 candidate review tests.',
                status: 'open'
            });

            us23ReviewApp = await Application.create({
                job: reviewJob._id,
                applicant: jobSeeker._id,
                resumeFilename: 'resume1.pdf',
                coverLetterFilename: 'cover_letter1.pdf',
                status: 'Applied'
            });
        });

        it('AT-23.1 / Task 23.1: returns candidate profile, attached CV, and cover letter for the posting recruiter', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body._id).toEqual(us23ReviewApp._id.toString());
            expect(res.body.resumeFilename).toEqual('resume1.pdf');
            expect(res.body.coverLetterFilename).toEqual('cover_letter1.pdf');

            expect(res.body).toHaveProperty('applicant');
            expect(res.body.applicant.fullName).toEqual('App Seeker');
            expect(res.body.applicant.email).toEqual(`seeker_app_${RUN_ID}@example.com`);
            expect(res.body.applicant).not.toHaveProperty('password');

            expect(res.body).toHaveProperty('job');
            expect(res.body.job.title).toEqual('Senior Developer Review Job');
        });

        it('AT-23.2 / Task 23.4: rejects a different recruiter with status 403', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${us23OtherRecruiterToken}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Not authorized to view this application');
        });

        it('Task 23.4: rejects a job seeker with status 403', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${seekerToken}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Recruiter access required');
        });

        it('Task 23.4: rejects unauthenticated requests with status 401', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`);

            expect(res.statusCode).toEqual(401);
        });

        it('Task 23.1: returns 404 for an invalid or non-existent application ID', async () => {
            const invalidRes = await request(app)
                .get('/api/applications/invalid-object-id')
                .set('Authorization', `Bearer ${us23RecruiterToken}`);
            expect(invalidRes.statusCode).toEqual(404);

            const fakeId = new mongoose.Types.ObjectId();
            const missingRes = await request(app)
                .get(`/api/applications/${fakeId}`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`);
            expect(missingRes.statusCode).toEqual(404);
        });
    });

    describe('US-23 & US-24 - Candidate Application Review, Stage Transitions & Status History', () => {
        let us23RecruiterToken;
        let us23OtherRecruiterToken;
        let us23ReviewApp;

        beforeEach(async () => {
            const secret = process.env.JWT_SECRET || 'secret_key';

            us23RecruiterToken = jwt.sign(
                { userId: recruiter._id, role: 'recruiter' },
                secret,
                { expiresIn: '1h' }
            );

            const otherRecruiter = await User.create({
                fullName: 'Other Recruiter',
                email: `other_recruiter_us23_${RUN_ID}_${Date.now()}@example.com`,
                password: 'password123',
                role: 'recruiter'
            });
            us23OtherRecruiterToken = jwt.sign(
                { userId: otherRecruiter._id, role: 'recruiter' },
                secret,
                { expiresIn: '1h' }
            );

            const reviewJob = await Job.create({
                recruiter: recruiter._id,
                company: 'Test Company',
                title: 'Senior Developer Review Job',
                location: APP_CITY,
                description: 'Job for US-23 and US-24 candidate review tests.',
                status: 'open'
            });

            us23ReviewApp = await Application.create({
                job: reviewJob._id,
                applicant: jobSeeker._id,
                resumeFilename: 'resume1.pdf',
                coverLetterFilename: 'cover_letter1.pdf',
                status: 'Applied'
            });
        });

        it('AT-23.1 & Task 23.1: returns candidate profile, attached CV, and cover letter for the posting recruiter', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body._id).toEqual(us23ReviewApp._id.toString());
            expect(res.body.resumeFilename).toEqual('resume1.pdf');
            expect(res.body.coverLetterFilename).toEqual('cover_letter1.pdf');

            expect(res.body).toHaveProperty('applicant');
            expect(res.body.applicant.fullName).toEqual('App Seeker');
            expect(res.body.applicant.email).toEqual(`seeker_app_${RUN_ID}@example.com`);
            expect(res.body.applicant).not.toHaveProperty('password');

            expect(res.body).toHaveProperty('job');
            expect(res.body.job.title).toEqual('Senior Developer Review Job');
        });

        it('AT-23.2 & Task 23.4: rejects a different recruiter with status 403', async () => {
            const res = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${us23OtherRecruiterToken}`);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toEqual('Not authorized to view this application');
        });

        it('Task 23.4: rejects a job seeker with status 403 and unauthenticated requests with 401', async () => {
            const seekerRes = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`)
                .set('Authorization', `Bearer ${seekerToken}`);
            expect(seekerRes.statusCode).toEqual(403);
            expect(seekerRes.body.message).toEqual('Recruiter access required');

            const unauthRes = await request(app)
                .get(`/api/applications/${us23ReviewApp._id}`);
            expect(unauthRes.statusCode).toEqual(401);
        });

        it('Task 23.1: returns 404 for an invalid or non-existent application ID', async () => {
            const invalidRes = await request(app)
                .get('/api/applications/invalid-object-id')
                .set('Authorization', `Bearer ${us23RecruiterToken}`);
            expect(invalidRes.statusCode).toEqual(404);

            const fakeId = new mongoose.Types.ObjectId();
            const missingRes = await request(app)
                .get(`/api/applications/${fakeId}`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`);
            expect(missingRes.statusCode).toEqual(404);
        });

        it('AT-24.1, Task 24.2 & Task 24.4: moves Applied -> Under Review -> Interview -> Offered, records statusHistory, and creates notification', async () => {
            const Notification = require('../models/Notification');
            
            const res1 = await request(app)
                .patch(`/api/applications/${us23ReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Under Review' });
            expect(res1.statusCode).toEqual(200);
            expect(res1.body.application.status).toEqual('Under Review');

            const res2 = await request(app)
                .patch(`/api/applications/${us23ReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Interview' });
            expect(res2.statusCode).toEqual(200);

            const res3 = await request(app)
                .patch(`/api/applications/${us23ReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Offered' });
            expect(res3.statusCode).toEqual(200);

            const updated = await Application.findById(us23ReviewApp._id);
            expect(updated.status).toEqual('Offered');
            expect(updated.statusHistory).toHaveLength(3);
            expect(updated.statusHistory[0]).toMatchObject({
                fromStatus: 'Applied',
                toStatus: 'Under Review',
                changedBy:recruiter._id
            });
            expect(updated.statusHistory[0].changedAt).toBeDefined();
            expect(updated.statusHistory[1]).toMatchObject({
                fromStatus: 'Under Review',
                toStatus: 'Interview'
            });
            expect(updated.statusHistory[2]).toMatchObject({
                fromStatus: 'Interview',
                toStatus: 'Offered'
            });

            const notif = await Notification.findOne({
                recipient: jobSeeker._id,
                application: us23ReviewApp._id,
                type: 'application_status',
                message: /Offered/i
            });
            expect(notif).not.toBeNull();
        });

        it('AT-24.2 & Task 24.5: blocks changes when Withdrawn or when stage transition is invalid', async () => {
            // 1. Withdrawn cannot be changed
            us23ReviewApp.status = 'Withdrawn';
            await us23ReviewApp.save();

            const withdrawnRes = await request(app)
                .patch(`/api/applications/${us23ReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Under Review' });
            expect(withdrawnRes.statusCode).toEqual(400);

            // 2. Backward transition (Under Review -> Applied) is blocked
            const extraJob1 = await Job.create({
                recruiter: recruiter._id,
                company: 'Test Company',
                title: 'Stage Transition Test Job 1',
                location: APP_CITY,
                description: 'Job for stage transition test 1.',
                status: 'open'
            });
            const underReviewApp = await Application.create({
                job: extraJob1._id,
                applicant: jobSeeker._id,
                status: 'Under Review'
            });
            const skipRes = await request(app)
                .patch(`/api/applications/${underReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Applied' });
            expect(skipRes.statusCode).toEqual(400);

            // 3. Offered -> Applied and Offered -> Interview are blocked
            const extraJob2 = await Job.create({
                recruiter: recruiter._id,
                company: 'Test Company',
                title: 'Stage Transition Test Job 2',
                location: APP_CITY,
                description: 'Job for stage transition test 2.',
                status: 'open'
            });
            const offeredApp = await Application.create({
                job: extraJob2._id,
                applicant: jobSeeker._id,
                status: 'Offered'
            });
            const backwardRes = await request(app)
                .patch(`/api/applications/${offeredApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Applied' });
            expect(backwardRes.statusCode).toEqual(400);

            const offeredToInterviewPatch = await request(app)
                .patch(`/api/applications/${offeredApp._id}/status`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({ status: 'Interview' });
            expect(offeredToInterviewPatch.statusCode).toEqual(400);

            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const offeredToInterviewInvite = await request(app)
                .post(`/api/applications/${offeredApp._id}/interview`)
                .set('Authorization', `Bearer ${us23RecruiterToken}`)
                .send({
                    scheduledAt: futureDate,
                    locationOrLink: 'https://meet.google.com/blocked-test',
                    message: 'Should be blocked'
                });
            expect(offeredToInterviewInvite.statusCode).toEqual(400);
        });

        it('Task 24.1: rejects status updates from a recruiter who does not own the job with 403', async () => {
            const res = await request(app)
                .patch(`/api/applications/${us23ReviewApp._id}/status`)
                .set('Authorization', `Bearer ${us23OtherRecruiterToken}`)
                .send({ status: 'Under Review' });

            expect(res.statusCode).toEqual(403);
        });
    });
});