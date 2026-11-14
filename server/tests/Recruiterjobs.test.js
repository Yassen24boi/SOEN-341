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
const FUTURE_DATE = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
})();

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

                it('should reject a deadline in the past and create nothing (AT-16.3)', async () => {
            const title = `Past Deadline ${RUN_ID}`;
            const res = await request(app)
                .post('/api/jobs')
                .set(auth(tokenA))
                .send(newJob({ title, deadline: '2020-01-01' }));

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Deadline must be a future date.');
            expect(await Job.countDocuments({ title })).toBe(0);
        });

        it('should accept a deadline in the future (AT-16.4)', async () => {
            const res = await request(app)
                .post('/api/jobs')
                .set(auth(tokenA))
                .send(newJob({ title: 'Future Deadline', deadline: FUTURE_DATE }));

            expect(res.statusCode).toEqual(201);
            expect(res.body.deadline).toBeTruthy();
        });

        it('should save category and requirements and reject an unknown category (AT-16.5)', async () => {
            const category = Job.JOB_CATEGORIES[0];
            const ok = await request(app)
                .post('/api/jobs')
                .set(auth(tokenA))
                .send(newJob({ title: 'With Extras', category, requirements: 'Node.js and MongoDB' }));
            const bad = await request(app)
                .post('/api/jobs')
                .set(auth(tokenA))
                .send(newJob({ category: 'banana' }));

            expect(ok.statusCode).toEqual(201);
            expect(ok.body).toHaveProperty('category', category);
            expect(ok.body).toHaveProperty('requirements', 'Node.js and MongoDB');
            expect(bad.statusCode).toEqual(400);
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

                it('should show a changed salary on the job details endpoint (AT-17.5)', async () => {
            const edit = await request(app)
                .put(`/api/jobs/${jobA._id}`)
                .set(auth(tokenA))
                .send({ salaryMin: 70000, salaryMax: 90000, salaryPeriod: 'yearly' });
            const details = await request(app).get(`/api/jobs/${jobA._id}`);

            expect(edit.statusCode).toEqual(200);
            expect(details.body).toHaveProperty('salaryMin', 70000);
            expect(details.body).toHaveProperty('salaryMax', 90000);
        });

        it('should reject a past deadline when editing but allow saving an unchanged one (AT-17.6)', async () => {
            const created = await request(app)
                .post('/api/jobs')
                .set(auth(tokenA))
                .send(newJob({ title: 'Deadline Edit', deadline: FUTURE_DATE }));
            const same = await request(app)
                .put(`/api/jobs/${created.body._id}`)
                .set(auth(tokenA))
                .send({ title: 'Deadline Edit 2', deadline: FUTURE_DATE });
            const past = await request(app)
                .put(`/api/jobs/${created.body._id}`)
                .set(auth(tokenA))
                .send({ deadline: '2020-01-01' });

            expect(same.statusCode).toEqual(200);
            expect(past.statusCode).toEqual(400);
            expect(past.body.message).toBe('Deadline must be a future date.');
        });

        it('should let only the owner close a posting through the close endpoint (AT-17.7)', async () => {
            const created = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob({ title: 'To Close' }));
            const other = await request(app).patch(`/api/jobs/${created.body._id}/close`).set(auth(tokenB));
            const owner = await request(app).patch(`/api/jobs/${created.body._id}/close`).set(auth(tokenA));

            expect(other.statusCode).toEqual(403);
            expect(owner.statusCode).toEqual(200);
            expect(owner.body).toHaveProperty('status', 'closed');
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
            expect(res.body[0]).toHaveProperty('status', 'Applied'); 
            expect(res.body[0]).toHaveProperty('createdAt');          
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
    describe('PATCH /api/jobs/:id/status - Archive and restore (Sprint 3: US-21)', () => {
        let archiveJob;

        beforeAll(async () => {
            const res = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob({ title: 'Archive Me' }));
            archiveJob = res.body;
        });

        it('should let the owner archive a posting and keep it in their own list (AT-21.1)', async () => {
            const res = await request(app)
                .patch(`/api/jobs/${archiveJob._id}/status`)
                .set(auth(tokenA))
                .send({ status: 'archived' });
            const mine = await request(app).get('/api/jobs/mine').set(auth(tokenA));
            const found = mine.body.find((j) => j._id === archiveJob._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'archived');
            expect(found).toHaveProperty('status', 'archived');
        });

        it('should hide an archived posting from job seekers and block new applications (AT-21.2)', async () => {
            const list = await request(app).get(`/api/jobs?location=${CITY}`);
            const apply = await request(app)
                .post(`/api/jobs/${archiveJob._id}/apply`)
                .set(auth(seekerToken))
                .send({ resumeFilename: 'cv.pdf' });

            expect(list.body.jobs.map((j) => j._id)).not.toContain(archiveJob._id);
            expect(apply.statusCode).toEqual(404);
        });

        it('should restore an archived posting as closed (AT-21.3)', async () => {
            const res = await request(app)
                .patch(`/api/jobs/${archiveJob._id}/status`)
                .set(auth(tokenA))
                .send({ status: 'closed' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'closed');
        });

        it("should not let another recruiter archive someone else's posting (AT-21.4)", async () => {
            const res = await request(app)
                .patch(`/api/jobs/${archiveJob._id}/status`)
                .set(auth(tokenB))
                .send({ status: 'archived' });

            expect(res.statusCode).toEqual(403);
            expect((await Job.findById(archiveJob._id)).status).toBe('closed');
        });

        it('should archive and restore through the dedicated endpoints (AT-21.5)', async () => {
            const archived = await request(app).patch(`/api/jobs/${archiveJob._id}/archive`).set(auth(tokenA));
            expect(archived.statusCode).toEqual(200);
            expect(archived.body).toHaveProperty('status', 'archived');
            expect(archived.body.archivedAt).toBeTruthy();

            const restored = await request(app).patch(`/api/jobs/${archiveJob._id}/restore`).set(auth(tokenA));
            expect(restored.statusCode).toEqual(200);
            expect(restored.body).toHaveProperty('status', 'closed');
            expect(restored.body.archivedAt).toBeFalsy();
        });

        it('should keep the applications of an archived posting readable (AT-21.6)', async () => {
            await Application.create({ job: archiveJob._id, applicant: seeker._id });
            await request(app).patch(`/api/jobs/${archiveJob._id}/archive`).set(auth(tokenA));
            const res = await request(app).get(`/api/jobs/${archiveJob._id}/applications`).set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
        });

        it('should only let the owner archive or restore, and only restore archived postings (AT-21.7)', async () => {
            const archiveOther = await request(app).patch(`/api/jobs/${archiveJob._id}/archive`).set(auth(tokenB));
            const restoreOther = await request(app).patch(`/api/jobs/${archiveJob._id}/restore`).set(auth(tokenB));
            await request(app).patch(`/api/jobs/${archiveJob._id}/restore`).set(auth(tokenA));
            const restoreOpen = await request(app).patch(`/api/jobs/${archiveJob._id}/restore`).set(auth(tokenA));

            expect(archiveOther.statusCode).toEqual(403);
            expect(restoreOther.statusCode).toEqual(403);
            expect(restoreOpen.statusCode).toEqual(400);
        });
    });

    describe('GET /api/jobs/:id/applications - Filter and sort (Sprint 3: US-22)', () => {
        let sortJob;

        beforeAll(async () => {
            const res = await request(app).post('/api/jobs').set(auth(tokenA)).send(newJob({ title: 'Sort Me' }));
            sortJob = res.body;

            // Charlie applied first (oldest), then Alice, then Bob (newest)
            const names = ['Charlie', 'Alice', 'Bob'];
            const statuses = ['Applied', 'Interview', 'Applied'];
            for (let i = 0; i < names.length; i++) {
                const user = await User.create({
                    fullName: names[i],
                    email: `rec_${names[i]}_${RUN_ID}@example.com`,
                    password: 'password123',
                    role: 'jobseeker'
                });
                await Application.create({
                    job: sortJob._id,
                    applicant: user._id,
                    status: statuses[i],
                    createdAt: new Date(`2026-01-0${i + 1}T12:00:00Z`)
                });
            }
        });

        const names = (res) => res.body.map((a) => a.applicant.fullName);

        it('should return only the applications with the chosen status (AT-22.1)', async () => {
            const res = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?status=Interview`)
                .set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(names(res)).toEqual(['Alice']);
        });

        it('should return an empty list when no application has that status (AT-22.2)', async () => {
            const res = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?status=Offered`)
                .set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(0);
        });

        it('should sort newest first by default and oldest first on request (AT-22.3)', async () => {
            const newest = await request(app).get(`/api/jobs/${sortJob._id}/applications`).set(auth(tokenA));
            const oldest = await request(app).get(`/api/jobs/${sortJob._id}/applications?sort=oldest`).set(auth(tokenA));

            expect(names(newest)).toEqual(['Bob', 'Alice', 'Charlie']);
            expect(names(oldest)).toEqual(['Charlie', 'Alice', 'Bob']);
        });

        it('should sort by applicant name (AT-22.4)', async () => {
            const res = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?sort=name`)
                .set(auth(tokenA));

            expect(names(res)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        it('should ignore an invalid status or sort value and return the default list (AT-22.5)', async () => {
            const res = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?status=banana&sort=nonsense`)
                .set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(names(res)).toEqual(['Bob', 'Alice', 'Charlie']);
        });

        it('should filter by a date range, newest first (AT-22.6)', async () => {
            const res = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?from=2026-01-02&to=2026-01-03`)
                .set(auth(tokenA));

            expect(res.statusCode).toEqual(200);
            expect(names(res)).toEqual(['Bob', 'Alice']);
        });

        it('should support a from-only date and ignore an invalid date (AT-22.7)', async () => {
            const fromOnly = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?from=2026-01-03`)
                .set(auth(tokenA));
            const badDate = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?from=notadate`)
                .set(auth(tokenA));

            expect(names(fromOnly)).toEqual(['Bob']);
            expect(badDate.statusCode).toEqual(200);
            expect(badDate.body).toHaveLength(3);
        });

        it('should combine status, date range and sort (AT-22.8)', async () => {
            const combined = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?status=Applied&from=2026-01-02&sort=oldest`)
                .set(auth(tokenA));
            const statusAndSort = await request(app)
                .get(`/api/jobs/${sortJob._id}/applications?status=Applied&sort=oldest`)
                .set(auth(tokenA));

            expect(names(combined)).toEqual(['Bob']);
            expect(names(statusAndSort)).toEqual(['Charlie', 'Bob']);
        });

        it('should return per-status counts on each posting in the dashboard list (AT-22.9)', async () => {
            const res = await request(app).get('/api/jobs/mine').set(auth(tokenA));
            const found = res.body.find((j) => j._id === sortJob._id);

            expect(res.statusCode).toEqual(200);
            expect(found.statusCounts).toEqual({ Applied: 2, Interview: 1 });
        });
    });

}); 