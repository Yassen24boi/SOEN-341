const express = require('express')
const router = express.Router();
const Application = require('../models/Application')
const Job = require('../models/Job')
const requireAuth = require('../middleware/auth')

const VALID_STATUSES = ['Applied', 'Under Review', 'Interview', 'Offered', 'Rejected', 'Withdrawn'];

// GET /api/applications (Matches /api/applications because of the router mount)
router.get('/', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.userId })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(applications);
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

    // Assuming your Job model stores the creator's ID as `recruiter` or `postedBy`
    if (job.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this application.' });
    }

    // 4. Update and save the status
    application.status = status;
    await application.save();

    res.json({ message: 'Application status updated successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

module.exports = router;