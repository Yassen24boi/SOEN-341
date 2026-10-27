const express = require('express')
const router = express.Router();
const Application = require('../models/Application')
const requireAuth = require('../middleware/auth')



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

module.exports = router;