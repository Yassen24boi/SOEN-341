const express = require('express')
const requireAuth = require('../middleware/auth')
const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')
const router = express.Router()

async function requireRecruiter(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Recruiters only' })
    }
    next()
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
async function getOwnedJob(req, res) {
  const job = await Job.findById(req.params.id)
  if (!job) {
    res.status(404).json({ message: 'Job not found' })
    return null
  }
  if (String(job.recruiter) !== String(req.userId)) {
    res.status(403).json({ message: 'Not your posting' })
    return null
  }
  return job
}
router.post('/', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const { title, company, location, type, description } = req.body
    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company and description are required' })
    }
    const job = await Job.create({ recruiter: req.userId, title, company, location, type, description })
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ message: 'Could not create posting' })
  }
})
router.get('/mine', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.userId }).sort({ createdAt: -1 }).lean()
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobs.map((j) => j._id) } } },
      { $group: { _id: '$job', count: { $sum: 1 } } }
    ])
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))
    res.json(jobs.map((j) => ({ ...j, applicationCount: countMap[String(j._id)] || 0 })))
  } catch (err) {
    res.status(500).json({ message: 'Could not load postings' })
  }
})
router.put('/:id', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const job = await getOwnedJob(req, res)
    if (!job) return
    const { title, company, location, type, description } = req.body
    if (title !== undefined) job.title = title
    if (company !== undefined) job.company = company
    if (location !== undefined) job.location = location
    if (type !== undefined) job.type = type
    if (description !== undefined) job.description = description
    await job.save()
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: 'Could not update posting' })
  }
})
router.patch('/:id/status', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const job = await getOwnedJob(req, res)
    if (!job) return
    if (!['open', 'closed'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Status must be open or closed' })
    }
    job.status = req.body.status
    await job.save()
    res.json(job)
  } catch (err) {
    res.status(500).json({ message: 'Could not change status' })
  }
})
router.delete('/:id', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const job = await getOwnedJob(req, res)
    if (!job) return
    await Application.deleteMany({ job: job._id })
    await job.deleteOne()
    res.json({ message: 'Posting deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Could not delete posting' })
  }
})
router.get('/:id/applications', requireAuth, requireRecruiter, async (req, res) => {
  try {
    const job = await getOwnedJob(req, res)
    if (!job) return
    const apps = await Application.find({ job: job._id })
      .sort({ createdAt: -1 })
      .populate('applicant', '-password')
    res.json(apps)
  } catch (err) {
    res.status(500).json({ message: 'Could not load applications' })
  }
})
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job || job.status !== 'open') return res.status(404).json({ message: 'Job not available' })
    const app = await Application.create({ job: job._id, applicant: req.userId })
    res.status(201).json(app)
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already applied' })
    res.status(500).json({ message: 'Could not apply' })
  }
})
module.exports = router