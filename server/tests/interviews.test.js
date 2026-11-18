const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');

// Allow 30 seconds for cloud database operations
jest.setTimeout(30000);

const RUN_ID = Date.now();

function daysFromNow(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('CareerConnect Interview Invitation Tests (US-30)', () => {
    let recruiter;
    let otherRecruiter;
    let seeker;
    let recruiterToken;
    let otherRecruiterToken;
    let seekerToken;
    let job;
    let application;

    function tokenFor(user) {
        return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    }

    function sendInvite(token, body, applicationId = application._id) {
        return request(app)
            .post(`/api/applications/${applicationId}/interview`)
            .set('Authorization', `Bearer ${token}`)
            .send(body);
    }

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/careerconnect_test');
        }
        recruiter = await User.create({ fullName: 'Interview Recruiter', email: `int_rec_${RUN_ID}@example.com`, password: 'password123', role: 'recruiter' });
        otherRecruiter = await User.create({ fullName: 'Other Recruiter', email: `int_other_${RUN_ID}@example.com`, password: 'password123', role: 'recruiter' });
        seeker = await User.create({ fullName: 'Interview Seeker', email: `int_seek_${RUN_ID}@example.com`, password: 'password123', role: 'jobseeker' });
        recruiterToken = tokenFor(recruiter);
        otherRecruiterToken = tokenFor(otherRecruiter);
        seekerToken = tokenFor(seeker);

        job = await Job.create({ recruiter: recruiter._id, title: `Interview Test Job ${RUN_ID}`, company: 'Test Company', description: 'A job for interview tests.' });
        application = await Application.create({ job: job._id, applicant: seeker._id, status: 'Under Review' });
    });

    afterAll(async () => {
        await Interview.deleteMany({ application: application._id });
        await Notification.deleteMany({ recipient: seeker._id });
        await Application.deleteMany({ job: job._id });
        await Job.deleteMany({ _id: job._id });
        await User.deleteMany({ _id: { $in: [recruiter._id, otherRecruiter._id, seeker._id] } });
        await mongoose.connection.close();
    });

    it('should reject an interview date in the past and send nothing (AT-30.2)', async () => {
        const res = await sendInvite(recruiterToken, {
            scheduledAt: daysFromNow(-1).toISOString(),
            locationOrLink: 'https://meet.example.com/abc'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Interview date must be in the future');
        expect(await Interview.countDocuments({ application: application._id })).toBe(0);
        expect(await Notification.countDocuments({ recipient: seeker._id })).toBe(0);
        expect((await Application.findById(application._id)).status).toBe('Under Review');
    });

    it('should reject a missing or invalid date', async () => {
        const missing = await sendInvite(recruiterToken, { locationOrLink: 'Room 101' });
        const invalid = await sendInvite(recruiterToken, { scheduledAt: 'next tuesday', locationOrLink: 'Room 101' });

        expect(missing.statusCode).toEqual(400);
        expect(invalid.statusCode).toEqual(400);
    });

    it('should require a location or meeting link', async () => {
        const res = await sendInvite(recruiterToken, { scheduledAt: daysFromNow(3).toISOString(), locationOrLink: '   ' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Please add a location or meeting link');
    });

    it('should not let another recruiter or the candidate send an invitation', async () => {
        const body = { scheduledAt: daysFromNow(3).toISOString(), locationOrLink: 'Room 101' };

        const other = await sendInvite(otherRecruiterToken, body);
        const candidate = await sendInvite(seekerToken, body);

        expect(other.statusCode).toEqual(403);
        expect(candidate.statusCode).toEqual(403);
    });

    it('should return 404 for an application that does not exist', async () => {
        const res = await sendInvite(recruiterToken, { scheduledAt: daysFromNow(3).toISOString(), locationOrLink: 'Room 101' }, new mongoose.Types.ObjectId());

        expect(res.statusCode).toEqual(404);
    });

    it('should save the interview, move the application to Interview and notify the candidate with the date and link (AT-30.1)', async () => {
        const when = daysFromNow(5);

        const res = await sendInvite(recruiterToken, {
            scheduledAt: when.toISOString(),
            locationOrLink: 'https://meet.example.com/abc',
            message: 'Looking forward to meeting you!'
        });

        expect(res.statusCode).toEqual(201);
        const interview = await Interview.findOne({ application: application._id });
        expect(interview.scheduledAt.toISOString()).toBe(when.toISOString());
        expect(interview.locationOrLink).toBe('https://meet.example.com/abc');
        expect(interview.message).toBe('Looking forward to meeting you!');
        expect((await Application.findById(application._id)).status).toBe('Interview');

        const notification = await Notification.findOne({ recipient: seeker._id, type: 'interview_invitation' });
        expect(notification.message).toContain(`Interview Test Job ${RUN_ID}`);
        expect(notification.message).toContain('https://meet.example.com/abc');
        expect(notification.message).toContain(String(when.getUTCFullYear()));
    });

    it('should update the same interview when it is rescheduled', async () => {
        const res = await sendInvite(recruiterToken, { scheduledAt: daysFromNow(7).toISOString(), locationOrLink: 'Room 204' });

        expect(res.statusCode).toEqual(201);
        expect(await Interview.countDocuments({ application: application._id })).toBe(1);
        expect((await Interview.findOne({ application: application._id })).locationOrLink).toBe('Room 204');
    });

    it("should show the interview details in the candidate's applications list (Task 30.3)", async () => {
        const res = await request(app)
            .get('/api/applications')
            .set('Authorization', `Bearer ${seekerToken}`);

        expect(res.statusCode).toEqual(200);
        const ours = res.body.find((a) => String(a._id) === String(application._id));
        expect(ours.status).toBe('Interview');
        expect(ours.interview.locationOrLink).toBe('Room 204');
        expect(ours.job.title).toBe(`Interview Test Job ${RUN_ID}`);
    });

    it('should not invite a candidate who withdrew', async () => {
        await Application.findByIdAndUpdate(application._id, { status: 'Withdrawn' });

        const res = await sendInvite(recruiterToken, { scheduledAt: daysFromNow(3).toISOString(), locationOrLink: 'Room 101' });

        expect(res.statusCode).toEqual(400);
    });
});
