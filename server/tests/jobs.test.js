const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// The shared cloud database can be slow, so allow 30 seconds instead of Jest's default 5
jest.setTimeout(30000);

// The database is shared with the team, so every job created here uses made-up
// locations that nobody else uses. Filtering by them means other jobs never affect
// the results, and afterAll deletes everything this file created.
const RUN_ID = Date.now();
const PAGINATION_CITY = `PaginationCity-${RUN_ID}`;
const SEARCH_CITY = `SearchCity-${RUN_ID}`;

function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('CareerConnect Job Search Tests', () => {
    let recruiter;
    let jobSeeker;
    let seekerToken;
    let recruiterToken;
    let javaJob;
    let closedJob;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }

        recruiter = await User.create({
            fullName: 'Test Recruiter',
            email: `recruiter_${RUN_ID}@example.com`,
            password: 'password123',
            role: 'recruiter'
        });
        jobSeeker = await User.create({
            fullName: 'Test Seeker',
            email: `seeker_${RUN_ID}@example.com`,
            password: 'password123',
            role: 'jobseeker'
        });
        const secret = process.env.JWT_SECRET || 'secret_key';
        seekerToken = jwt.sign({ userId: jobSeeker._id, role: 'jobseeker' }, secret, { expiresIn: '1h' });
        recruiterToken = jwt.sign({ userId: recruiter._id, role: 'recruiter' }, secret, { expiresIn: '1h' });

        // 25 open jobs, plus 1 closed and 1 expired job that must stay hidden
        const paginationJobs = [];
        for (let i = 1; i <= 25; i++) {
            paginationJobs.push({ title: `Pagination Job ${i}`, location: PAGINATION_CITY });
        }
        paginationJobs.push({ title: 'Closed Job', location: PAGINATION_CITY, status: 'closed' });
        paginationJobs.push({ title: 'Expired Job', location: PAGINATION_CITY, deadline: daysFromNow(-1) });

        const searchJobs = [
            { title: 'Java Developer', location: SEARCH_CITY, category: 'Software', type: 'full-time' },
            { title: 'UX Designer', location: SEARCH_CITY, category: 'Design', type: 'full-time' },
            { title: 'Software Developer Intern', location: SEARCH_CITY, category: 'Software', type: 'internship' },
            { title: 'Data Analyst Intern', location: SEARCH_CITY, category: 'Data', type: 'internship' }
        ];

        const created = await Job.insertMany(
            [...paginationJobs, ...searchJobs].map((job) => ({
                recruiter: recruiter._id,
                company: 'Test Company',
                description: 'A job created by the automated tests.',
                ...job
            }))
        );
        javaJob = created.find((job) => job.title === 'Java Developer');
        closedJob = created.find((job) => job.title === 'Closed Job');
    });

    afterAll(async () => {
        // Find the test users by their unique emails, so cleanup still works if beforeAll failed halfway
        const testUsers = await User.find({
            email: { $in: [`recruiter_${RUN_ID}@example.com`, `seeker_${RUN_ID}@example.com`] }
        });
        const testUserIds = testUsers.map((user) => user._id);
        await Application.deleteMany({ applicant: { $in: testUserIds } });
        await Job.deleteMany({ recruiter: { $in: testUserIds } });
        await User.deleteMany({ _id: { $in: testUserIds } });
        await mongoose.connection.close();
    });

    describe('GET /api/jobs - Browse job listings (US-08)', () => {
        it('should return 10 jobs per page and 3 pages for 25 open jobs (AT-08.1)', async () => {
            const res = await request(app).get(`/api/jobs?location=${PAGINATION_CITY}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.jobs).toHaveLength(10);
            expect(res.body.total).toBe(25);
            expect(res.body.totalPages).toBe(3);
            expect(res.body.page).toBe(1);
        });

        it('should return the remaining 5 jobs on page 3, with no job repeated across pages', async () => {
            const pages = await Promise.all(
                [1, 2, 3].map((page) => request(app).get(`/api/jobs?location=${PAGINATION_CITY}&page=${page}`))
            );
            const ids = pages.flatMap((res) => res.body.jobs.map((job) => job._id));

            expect(pages[2].body.jobs).toHaveLength(5);
            expect(new Set(ids).size).toBe(25);
        });

        it('should not list closed jobs or jobs past their deadline (AT-08.2)', async () => {
            const pages = await Promise.all(
                [1, 2, 3].map((page) => request(app).get(`/api/jobs?location=${PAGINATION_CITY}&page=${page}`))
            );
            const titles = pages.flatMap((res) => res.body.jobs.map((job) => job.title));

            expect(titles).not.toContain('Closed Job');
            expect(titles).not.toContain('Expired Job');
        });

        it('should return an empty list when no jobs match (AT-08.3)', async () => {
            const res = await request(app).get(`/api/jobs?location=NoJobsCity-${RUN_ID}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.jobs).toEqual([]);
            expect(res.body.total).toBe(0);
        });
    });

    describe('GET /api/jobs?q= - Search jobs by keyword (US-09)', () => {
        it('should only return matching jobs when searching "java" (AT-09.1)', async () => {
            const res = await request(app).get(`/api/jobs?location=${SEARCH_CITY}&q=java`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.jobs.map((job) => job.title)).toEqual(['Java Developer']);
        });

        it('should match partial words and ignore upper/lower case', async () => {
            const res = await request(app).get(`/api/jobs?location=${SEARCH_CITY}&q=DEVELOP`);
            const titles = res.body.jobs.map((job) => job.title);

            expect(titles).toHaveLength(2);
            expect(titles).toEqual(expect.arrayContaining(['Java Developer', 'Software Developer Intern']));
        });

        it('should return no jobs when nothing matches the search (AT-09.2)', async () => {
            const res = await request(app).get(`/api/jobs?location=${SEARCH_CITY}&q=astronaut`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.jobs).toEqual([]);
        });

        it('should not crash when the search contains special characters', async () => {
            const res = await request(app).get(`/api/jobs?q=${encodeURIComponent('c++ (senior)')}`);

            expect(res.statusCode).toEqual(200);
        });
    });

    describe('GET /api/jobs filters - Filter jobs by location and category (US-10)', () => {
        it('should only return jobs from the selected location (AT-10.1)', async () => {
            const res = await request(app).get(`/api/jobs?location=${SEARCH_CITY}`);

            expect(res.body.total).toBe(4);
            res.body.jobs.forEach((job) => expect(job.location).toBe(SEARCH_CITY));
        });

        it('should combine keyword, category and type so every result matches all three (AT-10.2)', async () => {
            const res = await request(app).get(
                `/api/jobs?location=${SEARCH_CITY}&q=developer&category=Software&type=internship`
            );

            expect(res.body.jobs.map((job) => job.title)).toEqual(['Software Developer Intern']);
        });

        it('should return the options for the filter dropdowns', async () => {
            const res = await request(app).get('/api/jobs/filters');

            expect(res.statusCode).toEqual(200);
            expect(res.body.locations).toEqual(expect.arrayContaining([PAGINATION_CITY, SEARCH_CITY]));
            expect(res.body.categories).toEqual(Job.JOB_CATEGORIES);
            expect(res.body.types).toEqual(['full-time', 'part-time', 'internship', 'contract']);
        });
    });

    describe('GET /api/jobs/:id - View job details (US-11)', () => {
        it('should return the full job details (AT-11.1)', async () => {
            const res = await request(app).get(`/api/jobs/${javaJob._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('title', 'Java Developer');
            expect(res.body).toHaveProperty('description', 'A job created by the automated tests.');
            expect(res.body).toHaveProperty('alreadyApplied', false);
        });

        it('should return 404 for an invalid or non-existent job id (AT-11.2)', async () => {
            const invalid = await request(app).get('/api/jobs/not-a-real-id');
            const missing = await request(app).get(`/api/jobs/${new mongoose.Types.ObjectId()}`);

            expect(invalid.statusCode).toEqual(404);
            expect(invalid.body.message).toBe('Job not found');
            expect(missing.statusCode).toEqual(404);
        });

        it('should still return a closed job so applicants can see it, with its status', async () => {
            const res = await request(app).get(`/api/jobs/${closedJob._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'closed');
        });

        it('should say alreadyApplied is true after the user applied (AT-11.3)', async () => {
            await Application.create({ job: javaJob._id, applicant: jobSeeker._id });

            const res = await request(app)
                .get(`/api/jobs/${javaJob._id}`)
                .set('Authorization', `Bearer ${seekerToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.alreadyApplied).toBe(true);
        });

        it('should not block the recruiter dashboard route GET /api/jobs/mine', async () => {
            const res = await request(app)
                .get('/api/jobs/mine')
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
