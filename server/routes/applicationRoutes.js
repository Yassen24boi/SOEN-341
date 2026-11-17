
const express = require('express');
const router = express.Router();

const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/auth');

const VALID_STATUSES = [
  'Applied',
  'Under Review',
  'Interview',
  'Offered',
  'Rejected',
  'Withdrawn'
];

// GET /api/applications
// Get all applications belonging to the logged-in job seeker.
router.get('/', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.userId
    })
      .populate('job')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Failed to fetch applications'
    });
  }
});

// PATCH /api/applications/:id/status
// Recruiters can update application statuses.
// Applicants can only withdraw their own applications.
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value provided.'
      });
    }

    // Find application
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    // Find associated job
    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({
        message: 'Associated job posting not found.'
      });
    }

    // Check permissions
    const isRecruiter =
      job.recruiter.toString() === req.userId;

    const isApplicant =
      application.applicant.toString() === req.userId;

    if (!isRecruiter && !isApplicant) {
      return res.status(403).json({
        message: 'Unauthorized to update this application.'
      });
    }

    if (isApplicant && !isRecruiter && status !== 'Withdrawn') {
      return res.status(403).json({
        message: 'Applicants can only update their application status to Withdrawn.'
      });
    }

    const previousStatus = application.status;

    // Prevent duplicate withdrawal notifications
    if (
      isApplicant &&
      !isRecruiter &&
      status === 'Withdrawn' &&
      previousStatus === 'Withdrawn'
    ) {
      return res.status(400).json({
        message: 'Application already withdrawn.'
      });
    }

    // Save new status
    application.status = status;
    await application.save();

    // US-29: Notify job seeker when recruiter changes status
    if (
      isRecruiter &&
      !isApplicant &&
      previousStatus !== status
    ) {
      try {
        await Notification.create({
          recipient: application.applicant,
          type: 'application_status',
          message: `Your application for "${job.title}" is now ${status}.`,
          application: application._id,
          job: job._id
        });
      } catch (err) {
        console.error(
          'Could not create application notification:',
          err
        );
      }
    }

    // US-32: Notify recruiter when candidate withdraws
    if (
      isApplicant &&
      !isRecruiter &&
      status === 'Withdrawn' &&
      previousStatus !== 'Withdrawn'
    ) {
      try {
        await Notification.create({
          recipient: job.recruiter,
          type: 'candidate_withdrew',
          message: `A candidate withdrew their application for "${job.title}".`,
          application: application._id,
          job: job._id
        });
      } catch (err) {
        console.error(
          'Could not create withdrawal notification:',
          err
        );
      }
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error while updating status'
    });
  }
});

// PATCH /api/applications/:id/withdraw
// Allows a job seeker to withdraw their own application.
router.patch('/:id/withdraw', requireAuth, async (req, res) => {
  try {
    // Find application
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found.'
      });
    }

    // Verify ownership
    if (application.applicant.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Unauthorized to withdraw this application.'
      });
    }

    // Prevent duplicate withdrawals
    if (application.status === 'Withdrawn') {
      return res.status(400).json({
        message: 'Application already withdrawn.'
      });
    }

    // Find associated job
    const job = await Job.findById(application.job);

    if (!job) {
      return res.status(404).json({
        message: 'Associated job posting not found.'
      });
    }

    // Update application status
    application.status = 'Withdrawn';
    await application.save();

    // US-32: Notify recruiter about withdrawal
    try {
      await Notification.create({
        recipient: job.recruiter,
        type: 'candidate_withdrew',
        message: `A candidate withdrew their application for "${job.title}".`,
        application: application._id,
        job: job._id
      });
    } catch (err) {
      console.error(
        'Could not create withdrawal notification:',
        err
      );
    }

    res.json({
      message: 'Application withdrawn successfully',
      application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error while withdrawing application'
    });
  }
});

module.exports = router;
