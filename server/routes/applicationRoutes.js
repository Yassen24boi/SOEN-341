const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const Application = require('../models/Application')
const Job = require('../models/Job')
const requireAuth = require('../middleware/auth')
const Notification = require('../models/Notification')
const Interview = require('../models/Interview')
const VALID_STATUSES = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected', 'Withdrawn'];
const APPLICATION_STATUSES = VALID_STATUSES;

function startOfUtcWeek(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
}

router.get('/me/stats', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const currentWeekStart = startOfUtcWeek(now);
    const firstWeekStart = new Date(currentWeekStart);
    firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - 11 * 7);
    const applicantId = new mongoose.Types.ObjectId(req.userId);

    const [counts, recentApplications] = await Promise.all([
      Application.aggregate([
        { $match: { applicant: applicantId } },
        { $group: { _id: { $ifNull: ['$status', 'Applied'] }, count: { $sum: 1 } } }
      ]),
      Application.find({
        applicant: applicantId,
        createdAt: { $gte: firstWeekStart, $lte: now }
      }).select('createdAt').lean()
    ]);

    const weeklyApplications = Array.from({ length: 12 }, (_, index) => {
      const weekStarting = new Date(firstWeekStart);
      weekStarting.setUTCDate(weekStarting.getUTCDate() + index * 7);
      return { weekStarting: weekStarting.toISOString().slice(0, 10), count: 0 };
    });

    recentApplications.forEach(({ createdAt }) => {
      const applicationWeek = startOfUtcWeek(new Date(createdAt));
      const weekIndex = Math.floor((applicationWeek - firstWeekStart) / (7 * 24 * 60 * 60 * 1000));
      if (weekIndex >= 0 && weekIndex < weeklyApplications.length) weeklyApplications[weekIndex].count += 1;
    });

    const statuses = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]));
    counts.forEach(({ _id, count }) => {
      if (Object.prototype.hasOwnProperty.call(statuses, _id)) statuses[_id] = count;
    });

    const total = counts.reduce((sum, { count }) => sum + count, 0);
    res.json({
      total,
      pending: statuses.Applied + statuses['Under Review'],
      statuses,
      weeklyApplications,
      responseRate: total ? Math.round(((total - statuses.Applied) / total) * 1000) / 10 : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch application statistics' });
  }
});

// GET /api/applications (Matches /api/applications because of the router mount)
router.get('/', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.userId })
      .populate('job')
      .sort({ createdAt: -1 })
      .lean();
    // US-30 (Task 30.3): attach each application's interview details, if the recruiter sent an invitation
    const interviews = await Interview.find({ application: { $in: applications.map((a) => a._id) } }).lean();
    const interviewFor = new Map(interviews.map((i) => [String(i.application), i]));
    res.json(applications.map((a) => ({ ...a, interview: interviewFor.get(String(a._id)) || null })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    // 1. Validate the incoming status value
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value provided.' });
    }

    // 2. Find the application by ID
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // 3. Optional Security Check: Verify the logged-in recruiter owns the job posting
    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ message: 'Associated job posting not found.' });
    }

    const isRecruiter = job.recruiter.toString() === req.userId;
    const isApplicant = application.applicant.toString() === req.userId;

    if (!isRecruiter && !isApplicant) {
      return res.status(403).json({ message: 'Unauthorized to update this application.' });
    }

    if (isApplicant && !isRecruiter && status !== 'Withdrawn'){
      return res.status(403).json({message: 'Applicants can only update their application status to Withdrawn.'});
    }

    // 4. Update and save the status
    const previousStatus = application.status;

    application.status = status;
    await application.save();

  if (isRecruiter && !isApplicant && previousStatus !== status) {
  try {
    await Notification.create({
      recipient: application.applicant,
      type: 'application_status',
      message: `Your application for "${job.title}" is now ${status}.`,
      application: application._id,
      job: job._id
    });
    } catch (err) {
    console.error('Could not create application notification:', err);
    }
  }

    res.json({ message: 'Application status updated successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});
// US-30: POST /api/applications/:id/interview - the recruiter invites a candidate to an interview.
// Saves the date, time, place or link and message, moves the application to "Interview" and notifies the candidate.
router.post('/:id/interview', requireAuth, async (req, res) => {
  try {
    const { scheduledAt, locationOrLink, message } = req.body;

    // AT-30.2: the date must be a real date in the future
    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({ message: 'Interview date must be in the future' });
    }
    if (!locationOrLink || !String(locationOrLink).trim()) {
      return res.status(400).json({ message: 'Please add a location or meeting link' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    const job = await Job.findById(application.job);
    if (!job || job.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the recruiter who posted this job can send interview invitations.' });
    }
    if (application.status === 'Withdrawn') {
      return res.status(400).json({ message: 'This candidate withdrew their application.' });
    }

    // Create the interview, or update it if one was already sent (rescheduling)
    const interview = await Interview.findOneAndUpdate(
      { application: application._id },
      { scheduledAt: date, locationOrLink: String(locationOrLink).trim(), message: String(message || '').trim() },
      { upsert: true, new: true, runValidators: true }
    );

    application.status = 'Interview';
    await application.save();

    // AT-30.1: the candidate gets a notification with the date and the link
    const when = date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' });
    try {
      await Notification.create({
        recipient: application.applicant,
        type: 'interview_invitation',
        message: `You're invited to an interview for "${job.title}" on ${when}. Where: ${interview.locationOrLink}`,
        application: application._id,
        job: job._id
      });
    } catch (err) {
      console.error('Could not create interview notification:', err);
    }

    res.status(201).json({ message: 'Interview invitation sent', application, interview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while sending the interview invitation' });
  }
});

router.patch('/:id/withdraw', requireAuth, async (req, res) => {
  try{
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({message: 'Application not found.'});
    }

    if(application.applicant.toString() !== req.userId) {
      return res.status(403).json({message: 'Unauthorized to withdraw this application.'})
    }

    application.status = 'Withdrawn';
    await application.save();

    res.json({message: 'Application withdrawn successfully', application})
  }
  catch (err){
    console.error(err);
    res.status(500).json({message: 'Server error while withdrawing application'})
  }
})

module.exports = router;