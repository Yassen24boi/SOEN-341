const express = require('express')
const mongoose = require('mongoose')
const requireAuth = require('../middleware/auth')
const User = require('../models/User')
const Job = require('../models/Job')
const ResumeFeedback = require('../models/ResumeFeedback')
const { extractResumeText } = require('../services/resumeText')
const { getResumeFeedback, getTailoredFeedback } = require('../services/resumeFeedback')
const router = express.Router()

// Task 33.4: each user can ask for AI feedback at most 5 times per hour
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const recentRequests = new Map() // userId -> times of their recent requests

// AT-38.2: shown when a CV has no text we can read, e.g. a scanned PDF that is only images
const UNREADABLE_CV = "We couldn't read text from this CV. Please upload a PDF or DOCX file with selectable text."

function isRateLimited(userId) {
  const now = Date.now()
  const recent = (recentRequests.get(userId) || []).filter((time) => now - time < RATE_WINDOW_MS)
  const limited = recent.length >= RATE_LIMIT
  if (!limited) recent.push(now)
  recentRequests.set(userId, recent)
  return limited
}

// US-36 (AT-36.2): GET /api/resumes/feedback/history - the logged-in user's earlier AI feedback, newest first
router.get('/feedback/history', requireAuth, async (req, res) => {
  try {
    const history = await ResumeFeedback.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50).lean()
    res.json(history)
  } catch (err) {
    console.error('Could not load feedback history:', err.message)
    res.status(500).json({ message: 'Could not load feedback history' })
  }
})

// US-33 / US-36: POST /api/resumes/:id/feedback - AI feedback on one of the logged-in user's own CVs.
// Use "default" as the id for the user's default CV. Send { jobId } to tailor the feedback to that job.
router.post('/:id/feedback', requireAuth, async (req, res) => {
  try {
    // Only look through the logged-in user's own CVs, so nobody can get feedback on someone else's
    const user = await User.findById(req.userId)
    const resumes = user ? user.resumes : []
    const resume = req.params.id === 'default'
      ? resumes.find((r) => r.isDefault) || resumes[0]
      : resumes.find((r) => String(r._id) === req.params.id)
    if (!resume) {
      const message = req.params.id === 'default' ? 'Upload a CV to your profile first' : 'Resume not found'
      return res.status(404).json({ message })
    }

    // US-36: the job to tailor the feedback to, if one was picked
    let job = null
    const jobId = req.body?.jobId
    if (jobId) {
      if (mongoose.isValidObjectId(jobId)) job = await Job.findById(jobId).lean()
      if (!job) {
        return res.status(404).json({ message: 'Job not found' })
      }
    }

    if (isRateLimited(String(req.userId))) {
      return res.status(429).json({ message: 'You can ask for feedback 5 times per hour. Please try again later.' })
    }

    let text = ''
    try {
      text = await extractResumeText(resume.filename)
    } catch (err) {
      console.error('Could not read CV file:', err.message)
    }
    if (!text) {
      return res.status(422).json({ message: UNREADABLE_CV })
    }

    const feedback = job ? await getTailoredFeedback(text, job) : await getResumeFeedback(text)

    // Task 36.4: save the result so the user can look back at it later
    const saved = await ResumeFeedback.create({
      user: req.userId,
      resumeId: resume._id,
      resumeLabel: resume.label,
      job: job ? job._id : null,
      jobTitle: job ? job.title : '',
      kind: job ? 'tailored' : 'general',
      feedback
    })

    res.json({
      ...feedback,
      kind: saved.kind,
      resumeId: resume._id,
      jobId: saved.job,
      jobTitle: saved.jobTitle,
      feedbackId: saved._id,
      createdAt: saved.createdAt,
      aiGenerated: true
    })
  } catch (err) {
    // AT-33.2: if the AI is down, too slow or gives a bad answer, only this feature fails
    if (process.env.NODE_ENV !== 'test') {
      console.error('AI feedback failed:', err.message)
    }
    res.status(503).json({ message: 'Feedback is unavailable, try again later' })
  }
})

module.exports = router