const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Replace the CV reader and the AI with fakes, so these tests never read files or call the AI
jest.mock('../services/resumeText');
jest.mock('../services/resumeFeedback');
const { extractResumeText } = require('../services/resumeText');
const { getResumeFeedback, getTailoredFeedback } = require('../services/resumeFeedback');

const app = require('../server');
const User = require('../models/User');
const Job = require('../models/Job');
const ResumeFeedback = require('../models/ResumeFeedback');

// The shared cloud database can be slow, so allow 30 seconds instead of Jest's default 5
jest.setTimeout(30000);

const RUN_ID = Date.now();
const GOOD_FEEDBACK = {
    strengths: ['Clear education section'],
    weaknesses: ['Vague project descriptions'],
    suggestions: ['Add numbers to your results', 'Name the technologies used', 'Add a short summary']
};
const TAILORED_FEEDBACK = {
    matchedSkills: ['React'],
    missingSkills: ['SQL'],
    suggestions: ['Add a project that uses SQL', 'Mention your React work first', 'List the databases you know']
};

describe('POST /api/resumes/:id/feedback (US-33, US-36)', () => {
    let owner;
    let otherUser;
    let ownerToken;
    let otherToken;
    let resumeId;
    let reactJob;

    async function createUser(name) {
        return User.create({
            fullName: name,
            email: `${name.toLowerCase()}_${RUN_ID}@example.com`,
            password: 'password123',
            role: 'jobseeker',
            resumes: [{ filename: `${name}_cv.pdf`, label: 'My CV', isDefault: true }]
        });
    }

    function tokenFor(user) {
        return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    }

    function askFeedback(id, token, body) {
        const req = request(app).post(`/api/resumes/${id}/feedback`).set('Authorization', `Bearer ${token}`);
        return body ? req.send(body) : req;
    }

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }
        owner = await createUser('Owner');
        otherUser = await createUser('Other');
        ownerToken = tokenFor(owner);
        otherToken = tokenFor(otherUser);
        resumeId = owner.resumes[0]._id;
        reactJob = await Job.create({
            recruiter: owner._id,
            title: `React Developer ${RUN_ID}`,
            company: 'Test Co',
            description: 'Build web pages.',
            requirements: 'React and SQL'
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        extractResumeText.mockResolvedValue('Owner CV text');
        getResumeFeedback.mockResolvedValue(GOOD_FEEDBACK);
        getTailoredFeedback.mockResolvedValue(TAILORED_FEEDBACK);
    });

    afterAll(async () => {
        const testUsers = await User.find({ email: { $regex: `_${RUN_ID}@example\\.com$` } });
        const testUserIds = testUsers.map((user) => user._id);
        await ResumeFeedback.deleteMany({ user: { $in: testUserIds } });
        await Job.deleteMany({ recruiter: { $in: testUserIds } });
        await User.deleteMany({ _id: { $in: testUserIds } });
        await mongoose.connection.close();
    });

    it('should return 401 when the user is not logged in', async () => {
        const res = await request(app).post(`/api/resumes/${resumeId}/feedback`);

        expect(res.statusCode).toEqual(401);
    });

    it('should return strengths, weaknesses, suggestions and an AI-generated label (AT-33.1)', async () => {
        const res = await askFeedback(resumeId, ownerToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.strengths).toEqual(GOOD_FEEDBACK.strengths);
        expect(res.body.weaknesses).toEqual(GOOD_FEEDBACK.weaknesses);
        expect(res.body.suggestions.length).toBeGreaterThanOrEqual(3);
        expect(res.body.aiGenerated).toBe(true);
        expect(res.body.kind).toBe('general');
        expect(String(res.body.resumeId)).toBe(String(resumeId));
        expect(extractResumeText).toHaveBeenCalledWith('Owner_cv.pdf');
    });

    it("should return 404 when asking for feedback on someone else's CV", async () => {
        const res = await askFeedback(resumeId, otherToken);

        expect(res.statusCode).toEqual(404);
        expect(getResumeFeedback).not.toHaveBeenCalled();
    });

    it('should return 404 for a CV id that does not exist', async () => {
        const res = await askFeedback(new mongoose.Types.ObjectId(), ownerToken);

        expect(res.statusCode).toEqual(404);
    });

    it("should say \"We couldn't read text from this CV\" when no text can be read (AT-38.2)", async () => {
        extractResumeText.mockResolvedValue('');

        const res = await askFeedback(resumeId, ownerToken);

        expect(res.statusCode).toEqual(422);
        expect(res.body.message).toContain("We couldn't read text from this CV");
        expect(getResumeFeedback).not.toHaveBeenCalled();
    });

    it('should show "Feedback is unavailable, try again later" when the AI is down or times out (AT-33.2)', async () => {
        getResumeFeedback.mockRejectedValue(new Error('fetch failed'));

        const res = await askFeedback(resumeId, ownerToken);

        expect(res.statusCode).toEqual(503);
        expect(res.body.message).toBe('Feedback is unavailable, try again later');
    });

    it('should keep the rest of the app working when the AI is down (AT-33.2)', async () => {
        getResumeFeedback.mockRejectedValue(new Error('fetch failed'));
        await askFeedback(resumeId, otherToken);

        const res = await request(app).get('/api/health');

        expect(res.statusCode).toEqual(200);
    });

    it('should limit each user to 5 feedback requests per hour', async () => {
        // A fresh user, so earlier tests don't count towards the limit
        const busyUser = await createUser('Busy');
        const busyToken = tokenFor(busyUser);
        const busyResumeId = busyUser.resumes[0]._id;

        for (let i = 0; i < 5; i++) {
            const ok = await askFeedback(busyResumeId, busyToken);
            expect(ok.statusCode).toEqual(200);
        }
        const blocked = await askFeedback(busyResumeId, busyToken);

        expect(blocked.statusCode).toEqual(429);
    });

    describe('Tailored to a job (US-36)', () => {
        it('should compare the CV with the chosen job and return matched skills, missing skills and suggestions (AT-36.1)', async () => {
            const tailorUser = await createUser('Tailor');

            const res = await askFeedback(tailorUser.resumes[0]._id, tokenFor(tailorUser), { jobId: reactJob._id });

            expect(res.statusCode).toEqual(200);
            expect(res.body.kind).toBe('tailored');
            expect(res.body.matchedSkills).toEqual(['React']);
            expect(res.body.missingSkills).toEqual(['SQL']);
            expect(res.body.suggestions.length).toBeGreaterThanOrEqual(3);
            expect(res.body.jobTitle).toBe(reactJob.title);
            const [cvText, job] = getTailoredFeedback.mock.calls[0];
            expect(cvText).toBe('Owner CV text');
            expect(job.requirements).toBe('React and SQL');
            expect(getResumeFeedback).not.toHaveBeenCalled();
        });

        it('should use the default CV when the id is "default" (Task 36.5)', async () => {
            const defaultUser = await createUser('Default');

            const res = await askFeedback('default', tokenFor(defaultUser), { jobId: reactJob._id });

            expect(res.statusCode).toEqual(200);
            expect(String(res.body.resumeId)).toBe(String(defaultUser.resumes[0]._id));
            expect(extractResumeText).toHaveBeenCalledWith('Default_cv.pdf');
        });

        it('should ask users without a CV to upload one first', async () => {
            const noCvUser = await User.create({
                fullName: 'No CV', email: `nocv_${RUN_ID}@example.com`, password: 'password123', role: 'jobseeker'
            });

            const res = await askFeedback('default', tokenFor(noCvUser), { jobId: reactJob._id });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Upload a CV to your profile first');
        });

        it('should return 404 for a job that does not exist', async () => {
            const res = await askFeedback(resumeId, otherToken, { jobId: new mongoose.Types.ObjectId() });
            const junk = await askFeedback(resumeId, ownerToken, { jobId: 'not-a-job' });

            expect(res.statusCode).toEqual(404);
            expect(junk.statusCode).toEqual(404);
            expect(junk.body.message).toBe('Job not found');
        });
    });

    describe('GET /api/resumes/feedback/history (US-36)', () => {
        it('should list every saved feedback with its date and the job it was for, newest first (AT-36.2)', async () => {
            const historyUser = await createUser('History');
            const token = tokenFor(historyUser);
            const cvId = historyUser.resumes[0]._id;
            await askFeedback(cvId, token);
            await askFeedback(cvId, token, { jobId: reactJob._id });

            const res = await request(app).get('/api/resumes/feedback/history').set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].kind).toBe('tailored');
            expect(res.body[0].jobTitle).toBe(reactJob.title);
            expect(res.body[0].feedback.missingSkills).toEqual(['SQL']);
            expect(res.body[1].kind).toBe('general');
            expect(res.body[1].feedback.strengths).toEqual(GOOD_FEEDBACK.strengths);
            expect(new Date(res.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(res.body[1].createdAt).getTime());
        });

        it("should not show other users' feedback", async () => {
            const res = await request(app).get('/api/resumes/feedback/history').set('Authorization', `Bearer ${otherToken}`);

            expect(res.statusCode).toEqual(200);
            res.body.forEach((item) => expect(String(item.user)).toBe(String(otherUser._id)));
        });

        it('should return 401 when the user is not logged in', async () => {
            const res = await request(app).get('/api/resumes/feedback/history');

            expect(res.statusCode).toEqual(401);
        });
    });
});