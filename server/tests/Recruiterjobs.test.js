const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// The shared cloud database can be slow, so allow 30 seconds
jest.setTimeout(30000);

// Unique values per run so the shared database is never affected by other runs or teammates
const RUN_ID = Date.now();
const CITY = `RecruiterCity-${RUN_ID}`;

describe('CareerConnect Recruiter Dashboard Tests (Sprint 2: US-16 to US-19)', () => {
    let recruiterA, recruiterB, seeker;
    let tokenA, tokenB, seekerToken;
    let jobA;

    const auth = (token) => ({ Authorization: `Bearer ${token}` });
    const newJob = (overrides = {}) => ({
        title: 'Backend Developer',
        company: 'Test Company',
        location: CITY,
        type: 'full-time',
        description: 'A job created by the recruiter tests.',
        ...overrides
    });

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }
        const secret = process.env.JWT_SECRET || 'secret_key';
        const make = (name, role) => User.create({
            fullName: name,
            email: `rec_${name.replace(/\s/g, '')}_${RUN_ID}@example.com`,
            password: 'password123',
            role
        });
        recruiterA = await make('Recruiter A', 'recruiter');
        recruiterB = await make('Recruiter B', 'recruiter');
        seeker = await make('Seeker', 'jobseeker');
        tokenA = jwt.sign({ userId: recruiterA._id, role: 'recruiter' }, secret, { expiresIn: '1h' });
        tokenB = jwt.sign({ userId: recruiterB._id, role: 'recruiter' }, secret, { expiresIn: '1h' });
        seekerToken = jwt.sign({ userId: seeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });
    });

    afterAll(async () => {
        const users = await User.find({ email: new RegExp(`^rec_.*_${RUN_ID}@example\\.com$`) });
        const ids = users.map((u) => u._id);
        const jobs = await Job.find({ recruiter: { $in: ids } });
        await Application.deleteMany({ job: { $in: jobs.map((j) => j._id) } });
        await Job.deleteMany({ recruiter: { $in: ids } });
        await User.deleteMany({ _id: { $in: ids } });
        await mongoose.connection.close();
    });

    describe('POST /api/jobs - Create a job posting (US-16)', () => {
        it('should let a recruiter create a posting that belongs to them (AT-16.1)', async () => {
            const res = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob());

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('title', 'Backend Developer');
            expect(res.body).toHaveProperty('status', 'open');
            expect(String(res.body.recruiter)).toBe(String(recruiterA._id));
            jobA = res.body;
        });

        it('should show the new posting in the public job list', async () => {
            const res = await request(app).get(`/api/jobs?location=${CITY}`);

            expect(res.body.jobs.map((j) => j._id)).toContain(jobA._id);
        });

        it('should reject a posting with a missing required field (AT-16.2)', async () => {
            const res = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob({ title: '' }));

            expect(res.statusCode).toEqual(400);
        });

        it('should not let a job seeker create a posting', async () => {
            const res = await request(app).post('/api/jobs').set(auth(seekerToken)).send(newJob());

            expect(res.statusCode).toEqual(403);
        });

        it('should reject a request with no token', async () => {
            const res = await request(app).post('/api/jobs').send(newJob());

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('PUT / PATCH / DELETE /api/jobs/:id - Edit, close or delete (US-17)', () => {
        it('should let the owner edit their posting (AT-17.1)', async () => {
            const res = await request(app)
                .put(`/api/jobs/${jobA._id}`)
                .set(auth(tokenA))
                .send({ title: 'Senior Backend Developer' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('title', 'Senior Backend Developer');
        });

        it('should hide a closed posting from the public list and bring it back when reopened (AT-17.2)', async () => {
            const closed = await request(app)
                .patch(`/api/jobs/${jobA._id}/status`)
                .set(auth(tokenA))
                .send({ status: 'closed' });
            const listClosed = await request(app).get(`/api/jobs?location=${CITY}`);

            expect(closed.statusCode).toEqual(200);
            expect(listClosed.body.jobs.map((j) => j._id)).not.toContain(jobA._id);

            await request(app).patch(`/api/jobs/${jobA._id}/status`).set(auth(tokenA)).send({ status: 'open' });
            const listOpen = await request(app).get(`/api/jobs?location=${CITY}`);

            expect(listOpen.body.jobs.map((j) => j._id)).toContain(jobA._id);
        });

        it('should reject an invalid status value', async () => {
            const res = await request(app)
                .patch(`/api/jobs/${jobA._id}/status`)
                .set(auth(tokenA))
                .send({ status: 'banana' });

            expect(res.statusCode).toEqual(400);
        });

        it("should not let another recruiter edit, close or delete someone else's posting (AT-17.3)", async () => {
            const edit = await request(app).put(`/api/jobs/${jobA._id}`).set(auth(tokenB)).send({ title: 'Hacked' });
            const close = await request(app).patch(`/api/jobs/${jobA._id}/status`).set(auth(tokenB)).send({ status: 'closed' });
            const del = await request(app).delete(`/api/jobs/${jobA._id}`).set(auth(tokenB));

            expect(edit.statusCode).toEqual(403);
            expect(close.statusCode).toEqual(403);
            expect(del.statusCode).toEqual(403);
            expect((await Job.findById(jobA._id)).title).toBe('Senior Backend Developer');
        });

        it('should let the owner delete a posting and its applications (AT-17.4)', async () => {
            const created = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob({ title: 'To Delete' }));
            await Application.create({ job: created.body._id, applicant: seeker._id });

            const res = await request(app).delete(`/api/jobs/${created.body._id}`).set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(await Job.findById(created.body._id)).toBeNull();
            expect(await Application.countDocuments({ job: created.body._id })).toBe(0);
        });
    });

    describe('GET /api/jobs/mine - Recruiter dashboard (US-18)', () => {
        it('should list only my own postings with their application counts (AT-18.1)', async () => {
            await Application.create({ job: jobA._id, applicant: seeker._id });

            const res = await request(app).get('/api/jobs/mine').set(auth(tokenA));
            const mine = res.body.find((j) => j._id === jobA._id);

            expect(res.statusCode).toEqual(200);
            res.body.forEach((job) => expect(String(job.recruiter)).toBe(String(recruiterA._id)));
            expect(mine.applicationCount).toBe(1);
        });

        it("should not include another recruiter's postings (AT-18.2)", async () => {
            const res = await request(app).get('/api/jobs/mine').set(auth(tokenB));

            expect(res.body.map((j) => j._id)).not.toContain(jobA._id);
        });

        it('should not let a job seeker open the dashboard route', async () => {
            const res = await request(app).get('/api/jobs/mine').set(auth(seekerToken));

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('GET /api/jobs/:id/applications - View applications (US-19)', () => {
        it('should show the owner the applications for their posting (AT-19.1)', async () => {
            const res = await request(app).get(`/api/jobs/${jobA._id}/applications`).set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].applicant).toHaveProperty('fullName', 'Seeker');
            expect(res.body[0].applicant).not.toHaveProperty('password');
        });

        it("should not show applications for another recruiter's posting (AT-19.2)", async () => {
            const res = await request(app).get(`/api/jobs/${jobA._id}/applications`).set(auth(tokenB));

            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 for a posting that does not exist', async () => {
            const res = await request(app)
                .get(`/api/jobs/${new mongoose.Types.ObjectId()}/applications`)
                .set(auth(tokenA));

            expect(res.statusCode).toEqual(404);
        });
    });
});