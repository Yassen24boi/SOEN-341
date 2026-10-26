const express = require('express')
const requireAuth = require('../middleware/auth')
const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const router = express.Router()

const PAGE_SIZE = 10

// Turns characters like . or ( into plain text, so a search for "c++" doesn't break the query
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Job seekers only see jobs that are open and whose deadline hasn't passed (or that have no deadline)
function visibleJobsFilter() {
  return {
    status: 'open',
    $or: [{ deadline: null }, { deadline: { $gt: new Date() } }]
  }
}


// Returns the logged-in user's id if a valid token was sent, otherwise null.
// Unlike requireAuth, it never blocks the request: logged-out visitors can still see the page.
function getOptionalUserId(req) {
  const authHeader = req.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return null
  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET).userId
  } catch (err) {
    return null
  }
}


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
// US-08, US-09, US-10: list open jobs, 10 per page, with optional keyword search and filters
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const location = String(req.query.location || '')
    const category = String(req.query.category || '')
    const type = String(req.query.type || '')
    const page = Math.max(parseInt(req.query.page) || 1, 1)

    // Every condition in this list must be true for a job to be returned
    const conditions = [visibleJobsFilter()]
    if (q) {
      const keyword = new RegExp(escapeRegex(q), 'i')
      conditions.push({ $or: [{ title: keyword }, { company: keyword }, { description: keyword }] })
    }
    if (location) conditions.push({ location })
    if (category) conditions.push({ category })
    if (type) conditions.push({ type })
    const filter = { $and: conditions }

    const total = await Job.countDocuments(filter)
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select('title company location category type salaryMin salaryMax deadline createdAt')
      .lean()
    res.json({ jobs, page, totalPages: Math.ceil(total / PAGE_SIZE), total })
  } catch (err) {
    res.status(500).json({ message: 'Could not load jobs' })
  }
})
// US-10: the options for the filter dropdowns
router.get('/filters', async (req, res) => {
  try {
    const locations = await Job.distinct('location', visibleJobsFilter())
    res.json({
      locations: locations.filter(Boolean).sort(),
      categories: Job.JOB_CATEGORIES,
      types: Job.schema.path('type').enumValues
    })
  } catch (err) {
    res.status(500).json({ message: 'Could not load filters' })
  }
})

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
// US-11: full details of one job. If the user is logged in, also says whether they already applied.
// This must stay below GET /mine, otherwise "/mine" would be treated as a job id.
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Job not found' })
    }
    const job = await Job.findById(req.params.id).lean()
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const userId = getOptionalUserId(req)
    const alreadyApplied = userId
      ? Boolean(await Application.exists({ job: job._id, applicant: userId }))
      : false
    res.json({ ...job, alreadyApplied })
  } catch (err) {
    res.status(500).json({ message: 'Could not load job' })
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