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

describe('CareerConnect Job Application Tests (Sprint 2: US-12)', () => {
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
            email: { $in: [`recruiter_app_${RUN_ID}@example.com`, `seeker_app_${RUN_ID}@example.com`] }
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
    });
});