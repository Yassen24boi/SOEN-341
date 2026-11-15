const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Replace the CV reader and the AI with fakes, so these tests never read files or call the AI
jest.mock('../services/resumeText');
jest.mock('../services/resumeFeedback');
const { extractResumeText } = require('../services/resumeText');
const { getResumeFeedback } = require('../services/resumeFeedback');

const app = require('../server');
const User = require('../models/User');

// The shared cloud database can be slow, so allow 30 seconds instead of Jest's default 5
jest.setTimeout(30000);

const RUN_ID = Date.now();
const GOOD_FEEDBACK = {
    strengths: ['Clear education section'],
    weaknesses: ['Vague project descriptions'],
    suggestions: ['Add numbers to your results', 'Name the technologies used', 'Add a short summary']
};

describe('POST /api/resumes/:id/feedback (US-33)', () => {
    let owner;
    let otherUser;
    let ownerToken;
    let otherToken;
    let resumeId;

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

    function askFeedback(id, token) {
        return request(app).post(`/api/resumes/${id}/feedback`).set('Authorization', `Bearer ${token}`);
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
    });

    beforeEach(() => {
        jest.clearAllMocks();
        extractResumeText.mockResolvedValue('Owner CV text');
        getResumeFeedback.mockResolvedValue(GOOD_FEEDBACK);
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $regex: `_${RUN_ID}@example\\.com$` } });
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

    it('should return 422 when no text can be read from the CV', async () => {
        extractResumeText.mockResolvedValue('');

        const res = await askFeedback(resumeId, ownerToken);

        expect(res.statusCode).toEqual(422);
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
        await askFeedback(resumeId, ownerToken);

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
});
