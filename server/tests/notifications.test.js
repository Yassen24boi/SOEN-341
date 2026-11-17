const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mock the Notification model BEFORE loading the app
jest.mock('../models/Notification', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

const Notification = require('../models/Notification');
jest.mock('../models/Application', () => ({
  findById: jest.fn()
}));

jest.mock('../models/Job', () => ({
  findById: jest.fn()
}));

const Application = require('../models/Application');
const Job = require('../models/Job');
const app = require('../server');

const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();
const notificationId = new mongoose.Types.ObjectId().toString();

const token = jwt.sign( 
{ userId, role: 'jobseeker' },
  process.env.JWT_SECRET || 'secret_key',
{ expiresIn: '1h' }
);

const auth = { Authorization: `Bearer ${token}` };

const sampleNotification = {
  _id: notificationId,
  recipient: userId,
  type: 'application_status',
  message: 'Your application for Software Engineer is now Offered.',
  readAt: null
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('US-28: Notification Centre', () => {

  test('GET returns notifications and unread count', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([sampleNotification])
    };

    Notification.find.mockReturnValue(query);
    Notification.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/notifications')
      .set(auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(Notification.find).toHaveBeenCalledWith({
      recipient: userId
    });
  });

  test('GET rejects invalid page numbers', async () => {
    const res = await request(app)
      .get('/api/notifications?page=-1')
      .set(auth);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid page number');
  });

  test('GET rejects unauthenticated users', async () => {
    const res = await request(app)
      .get('/api/notifications');

    expect(res.statusCode).toBe(401);
  });

  test('PATCH marks one notification as read', async () => {
    const readNotification = {
      ...sampleNotification,
      readAt: new Date()
    };

    Notification.findOneAndUpdate.mockResolvedValue(readNotification);

    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.readAt).not.toBeNull();

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: notificationId,
        recipient: userId,
        readAt: null
      },
      {
        $set: { readAt: expect.any(Date) }
      },
      { new: true }
    );
  });

  test('PATCH rejects an invalid notification ID', async () => {
    const res = await request(app)
      .patch('/api/notifications/invalid-id/read')
      .set(auth);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid notification ID');
  });

  test('PATCH returns 404 for another user notification', async () => {
    Notification.findOneAndUpdate.mockResolvedValue(null);
    Notification.findOne.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(auth);

    expect(res.statusCode).toBe(404);
    expect(Notification.findOne).toHaveBeenCalledWith({
      _id: notificationId,
      recipient: userId
    });
  });

  test('PATCH preserves the original read timestamp', async () => {
    const originalDate = new Date('2026-01-01');

    Notification.findOneAndUpdate.mockResolvedValue(null);
    Notification.findOne.mockResolvedValue({
      ...sampleNotification,
      readAt: originalDate
    });

    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.readAt).toBe(originalDate.toISOString());
  });

  test('PATCH read-all updates only current user notifications', async () => {
    Notification.updateMany.mockResolvedValue({
      modifiedCount: 3
    });

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set(auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.modifiedCount).toBe(3);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      {
        recipient: userId,
        readAt: null
      },
      {
        $set: { readAt: expect.any(Date) }
      }
    );
  });

  test('PATCH read-all rejects unauthenticated users', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all');

    expect(res.statusCode).toBe(401);
    expect(Notification.updateMany).not.toHaveBeenCalled();
  });

});

describe('US-29: Application Status Notifications', () => {

  const recruiterId = new mongoose.Types.ObjectId().toString();
  const applicantId = new mongoose.Types.ObjectId().toString();
  const applicationId = new mongoose.Types.ObjectId().toString();
  const jobId = new mongoose.Types.ObjectId().toString();

  const recruiterToken = jwt.sign(
    { userId: recruiterId, role: 'recruiter' },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1h' }
  );

  let application;

  beforeEach(() => {
    jest.clearAllMocks();

    application = {
      _id: applicationId,
      applicant: applicantId,
      job: jobId,
      status: 'Applied',
      save: jest.fn().mockResolvedValue(true)
    };

    Application.findById.mockResolvedValue(application);

    Job.findById.mockResolvedValue({
      _id: jobId,
      recruiter: recruiterId,
      title: 'Software Engineer'
    });

    Notification.create.mockResolvedValue({});
  });

  const changeStatus = (status) =>
    request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status });

  test('AT-29.1: Status change creates exactly one notification', async () => {
    const res = await changeStatus('Offered');

    expect(res.statusCode).toBe(200);
    expect(application.status).toBe('Offered');
    expect(Notification.create).toHaveBeenCalledTimes(1);
  });

  test('Notification includes job title and new status', async () => {
    await changeStatus('Interview');

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application_status',
        message: expect.stringContaining('Software Engineer')
      })
    );

    const notification = Notification.create.mock.calls[0][0];

    expect(notification.message).toContain('Interview');
  });

  test('Notification goes to the correct job seeker', async () => {
    await changeStatus('Offered');

    expect(Notification.create).toHaveBeenCalledWith({
      recipient: applicantId,
      type: 'application_status',
      message: 'Your application for "Software Engineer" is now Offered.',
      application: applicationId,
      job: jobId
    });
  });

  test('AT-29.2: Unchanged status creates no notification', async () => {
    application.status = 'Under Review';

    const res = await changeStatus('Under Review');

    expect(res.statusCode).toBe(200);
    expect(Notification.create).not.toHaveBeenCalled();
  });

});