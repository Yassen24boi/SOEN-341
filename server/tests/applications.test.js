const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

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
            email: { $in: [`recruiter_app_${RUN_ID}@example.com`, `seeker_app_${RUN_ID}@example.com`, `seeker2_app_${RUN_ID}@example.com`, `stats_app_${RUN_ID}@example.com`, `activity_app_${RUN_ID}@example.com`] }
        });
        const testUserIds = testUsers.map((user) => user._id);
        await Application.deleteMany({ applicant: { $in: testUserIds } });
        await Job.deleteMany({ recruiter: { $in: testUserIds } });
        await User.deleteMany({ _id: { $in: testUserIds } });
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
        let seekerApp;
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
});