const express = require('express')
const requireAuth = require('../middleware/auth')
const User = require('../models/User')
const { extractResumeText } = require('../services/resumeText')
const { getResumeFeedback } = require('../services/resumeFeedback')
const router = express.Router()

// Task 33.4: each user can ask for AI feedback at most 5 times per hour
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const recentRequests = new Map() // userId -> times of their recent requests

function isRateLimited(userId) {
  const now = Date.now()
  const recent = (recentRequests.get(userId) || []).filter((time) => now - time < RATE_WINDOW_MS)
  const limited = recent.length >= RATE_LIMIT
  if (!limited) recent.push(now)
  recentRequests.set(userId, recent)
  return limited
}

// US-33: POST /api/resumes/:id/feedback - AI feedback on one of the logged-in user's own CVs
router.post('/:id/feedback', requireAuth, async (req, res) => {
  try {
    // Only look through the logged-in user's own CVs, so nobody can get feedback on someone else's
    const user = await User.findById(req.userId)
    const resume = user && user.resumes.find((r) => String(r._id) === req.params.id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
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
      return res.status(422).json({ message: "We couldn't read any text from this CV. Please upload a PDF or DOCX file with selectable text." })
    }

    const feedback = await getResumeFeedback(text)
    res.json({ resumeId: resume._id, ...feedback, aiGenerated: true })
  } catch (err) {
    // AT-33.2: if the AI is down, too slow or gives a bad answer, only this feature fails
    console.error('AI feedback failed:', err.message)
    res.status(503).json({ message: 'Feedback is unavailable, try again later' })
  }
})

module.exports = router
