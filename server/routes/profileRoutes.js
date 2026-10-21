const express = require('express')
const multer = require('multer')
const path = require('path')
const User = require('../models/User')
const requireAuth = require('../middleware/auth')

const router = express.Router()

// Configure where uploaded resumes get saved and how they're named
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.userId}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx']
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, or DOCX files are allowed'))
    }
  }
})

// GET /api/profile - get the logged-in user's own profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/profile - update fullName, email, headline
router.put('/', requireAuth, async (req, res) => {
  try {
    const { fullName, email, headline } = req.body
    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, email, headline },
      { new: true, runValidators: true }
    ).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/profile/resume - upload a resume file
router.post('/resume', requireAuth, upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const user = await User.findByIdAndUpdate(
      req.userId,
      { resumeFileName: req.file.filename },
      { new: true }
    ).select('-password')

    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/profile/resume - download the logged-in user's resume
router.get('/resume', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || !user.resumeFileName) {
      return res.status(404).json({ message: 'No resume uploaded' })
    }
    res.download(path.join(__dirname, '..', 'uploads', user.resumeFileName))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router