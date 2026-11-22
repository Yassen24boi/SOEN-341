const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Replace the AI and the CV reader with fakes, so these tests never call Ollama or read files
jest.mock('../services/ollamaClient');
jest.mock('../services/resumeText');
const { askOllama } = require('../services/ollamaClient');
const { extractResumeText } = require('../services/resumeText');
const { clearRecommendationCache } = require('../services/recommendationCache');

const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Job = require('../models/Job');
const Application = require('../models/Application');

// The shared cloud database can be slow, so allow 30 seconds instead of Jest's default 5
jest.setTimeout(30000);

const RUN_ID = Date.now();

// Our fake AI reads the numbered job list it was given and scores our test jobs by title,
// so the tests work no matter what other jobs are in the shared database.
function fakeAIScoring(scoresByTitle) {
    askOllama.mockImplementation(async (systemPrompt, userMessage) => {
        const matches = [];
        for (const line of userMessage.split('\n')) {
            const found = line.match(/^(\d+)\. (.+?) at /);
            if (found && scoresByTitle[found[2]] !== undefined) {
                matches.push({ jobNumber: Number(found[1]), score: scoresByTitle[found[2]], reason: `Matches your skills for ${found[2]}` });
            }
        }
        return JSON.stringify({ matches });
    });
}

describe('GET /api/jobs/recommended (US-34)', () => {
    let recruiter;
    let seeker;
    let emptySeeker;
    let seekerToken;
    let emptyToken;
    const titles = {
        java: `Java Developer ${RUN_ID}`,
        spring: `Spring Intern ${RUN_ID}`,
        design: `Graphic Designer ${RUN_ID}`,
        applied: `Applied Java Job ${RUN_ID}`
    };
    let appliedJob;

    function tokenFor(user) {
        return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    }

    function getRecommendations(token) {
        return request(app).get('/api/jobs/recommended').set('Authorization', `Bearer ${token}`);
    }

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }
        recruiter = await User.create({ fullName: 'Rec', email: `rec_${RUN_ID}@example.com`, password: 'password123', role: 'recruiter' });
        seeker = await User.create({ fullName: 'Seeker', email: `seeker_${RUN_ID}@example.com`, password: 'password123', role: 'jobseeker' });
        emptySeeker = await User.create({ fullName: 'Empty', email: `empty_${RUN_ID}@example.com`, password: 'password123', role: 'jobseeker' });
        await Profile.create({ user_id: seeker._id, skills: ['Java', 'Spring'] });
        seekerToken = tokenFor(seeker);
        emptyToken = tokenFor(emptySeeker);

        const jobs = await Job.insertMany(Object.values(titles).map((title) => ({
            recruiter: recruiter._id, title, company: 'Test Co', description: 'A test job.'
        })));
        appliedJob = jobs.find((job) => job.title === titles.applied);
        await Application.create({ job: appliedJob._id, applicant: seeker._id });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        extractResumeText.mockResolvedValue('');
        clearRecommendationCache();
    });

    afterAll(async () => {
        const users = [recruiter, seeker, emptySeeker].filter(Boolean).map((user) => user._id);
        await Application.deleteMany({ applicant: { $in: users } });
        await Job.deleteMany({ recruiter: recruiter._id });
        await Profile.deleteMany({ user_id: { $in: users } });
        await User.deleteMany({ _id: { $in: users } });
        await mongoose.connection.close();
    });

    it('should return 401 when the user is not logged in', async () => {
        const res = await request(app).get('/api/jobs/recommended');

        expect(res.statusCode).toEqual(401);
    });

    it('should rank Java/Spring roles above unrelated roles, each with a score and a reason (AT-34.1)', async () => {
        fakeAIScoring({ [titles.design]: 15, [titles.spring]: 80, [titles.java]: 95 });

        const res = await getRecommendations(seekerToken);

        expect(res.statusCode).toEqual(200);
        const ours = res.body.recommendations.filter((r) => r.job.title.endsWith(String(RUN_ID)));
        expect(ours.map((r) => r.job.title)).toEqual([titles.java, titles.spring]);
        expect(ours.map((r) => r.job.title)).not.toContain(titles.design);        expect(ours[0].matchScore).toBe(95);
        expect(ours[0].reason).toContain('Matches your skills');
        expect(ours[0].job).not.toHaveProperty('description');
    });

    it('should not recommend jobs the user already applied to', async () => {
        fakeAIScoring({ [titles.applied]: 99, [titles.java]: 90 });

        const res = await getRecommendations(seekerToken);

        const recommendedTitles = res.body.recommendations.map((r) => r.job.title);
        expect(recommendedTitles).toContain(titles.java);
        expect(recommendedTitles).not.toContain(titles.applied);
    });

    it('should ask the user to complete their profile when they have no skills and no CV (AT-34.2)', async () => {
        const res = await getRecommendations(emptyToken);

        expect(res.statusCode).toEqual(422);
        expect(res.body.needsProfile).toBe(true);
        expect(res.body.message).toContain('Add your skills');
        expect(askOllama).not.toHaveBeenCalled();
    });

  it('should show "Recommendations are unavailable, try again later" when the AI is down', async () => {
    // Simulate the AI service being unavailable
    askOllama.mockRejectedValue(new Error('fetch failed'));

    // Suppress the expected console error during this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
        const res = await getRecommendations(seekerToken);

        expect(res.statusCode).toEqual(503);
        expect(res.body.message).toBe(
            'Recommendations are unavailable, try again later'
        );
    } finally {
        // Restore normal error logging after the test
        consoleSpy.mockRestore();
    }
});

    it('should not break GET /api/jobs/:id for real job ids', async () => {
        const res = await request(app).get(`/api/jobs/${appliedJob._id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe(titles.applied);
    });

   

    it('should refresh recommendations when the profile changes (Task 37.3)', async () => {
        fakeAIScoring({ [titles.java]: 95 });
        await getRecommendations(seekerToken);

        await Profile.updateOne({ user_id: seeker._id }, { skills: ['Java', 'Spring', 'SQL'] });
        const res = await getRecommendations(seekerToken);

        expect(res.body.cached).toBe(false);
        expect(askOllama).toHaveBeenCalledTimes(2);
    });

    it('should drop a job from the recommendations after the user applies to it (AT-37.2)', async () => {
        fakeAIScoring({ [titles.java]: 95, [titles.spring]: 80 });
        const before = await getRecommendations(seekerToken);
        expect(before.body.recommendations.map((r) => r.job.title)).toContain(titles.spring);

        const springJob = await Job.findOne({ title: titles.spring });
        await Application.create({ job: springJob._id, applicant: seeker._id });
        const after = await getRecommendations(seekerToken);

        expect(after.body.cached).toBe(false);
        expect(after.body.recommendations.map((r) => r.job.title)).not.toContain(titles.spring);
        await Application.deleteOne({ job: springJob._id, applicant: seeker._id });
    });

    it('should never recommend closed or archived jobs (Task 37.4)', async () => {
        const [closedJob, archivedJob] = await Job.insertMany([
            { recruiter: recruiter._id, title: `Closed Java Job ${RUN_ID}`, company: 'Test Co', description: 'A test job.', status: 'closed' },
            { recruiter: recruiter._id, title: `Archived Java Job ${RUN_ID}`, company: 'Test Co', description: 'A test job.', status: 'archived' }
        ]);
        fakeAIScoring({ [closedJob.title]: 99, [archivedJob.title]: 99, [titles.java]: 90 });

        const res = await getRecommendations(seekerToken);

        const recommendedTitles = res.body.recommendations.map((r) => r.job.title);
        expect(recommendedTitles).toContain(titles.java);
        expect(recommendedTitles).not.toContain(closedJob.title);
        expect(recommendedTitles).not.toContain(archivedJob.title);
    });
    
    it('should still find relevant jobs when many newer unrelated jobs exist (US-37)', async () => {
        // 45 newer jobs with nothing in common with a Java/Spring profile
        await Job.insertMany(Array.from({ length: 45 }, (_, i) => ({
            recruiter: recruiter._id, title: `Bakery Shift ${i} ${RUN_ID}`, company: 'Test Co', description: 'Bake bread.'
        })));
        fakeAIScoring({ [titles.java]: 95 });

        const res = await getRecommendations(seekerToken);

        expect(res.body.recommendations.map((r) => r.job.title)).toContain(titles.java);
    });
});
