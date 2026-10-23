const express = require('express')
const multer = require('multer')
const path = require('path')
const User = require('../models/User')
const Profile = require('../models/Profile')
const requireAuth = require('../middleware/auth')

const router = express.Router()

// Configure Multer to keep a clean, recognizable filename with a unique timestamp prefix
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/\s+/g, '_')
    const uniqueName = `${Date.now()}-${cleanOriginalName}`
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

// Helper to format user + profile combined data including resume metadata
const buildCombinedResponse = (user, profile) => {
  const userObj = user.toObject ? user.toObject() : user
  const profileObj = profile && profile.toObject ? profile.toObject() : (profile || {})

  return {
    ...userObj,
    ...profileObj,
    resumeFileName: userObj.resumeFileName || null,
    resumeUpdatedAt: userObj.updatedAt || null // Exposes upload/update date to the frontend
  }
}

// GET /api/profile - get the logged-in user's user details AND extended profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const profile = await Profile.findOne({ user_id: req.userId })
    res.json(buildCombinedResponse(user, profile))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/profile - update user info and full professional profile
const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

router.put('/', requireAuth, async (req, res) => {
  const { fullName, email, headline, location, phone, summary, skills, links, experience, education } = req.body
  const errors = {}

  if (phone && !phoneRegex.test(phone)) errors.phone = 'Invalid phone number format'
  if (links) {
    if (links.portfolio && !urlRegex.test(links.portfolio)) errors.portfolio = 'Invalid URL format'
    if (links.linkedin && !urlRegex.test(links.linkedin)) errors.linkedin = 'Invalid URL format'
    if (links.github && !urlRegex.test(links.github)) errors.github = 'Invalid URL format'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors })
  }

  try {
    await User.findByIdAndUpdate(
      req.userId,
      { fullName, email, headline, location },
      { new: true, runValidators: true }
    )

    const profileFields = {
      user_id: req.userId,
      headline,
      location,
      phone,
      summary,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      links: links || {},
      experience: experience || [],
      education: education || []
    }

    let profile = await Profile.findOne({ user_id: req.userId })
    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user_id: req.userId },
        { $set: profileFields },
        { new: true }
      )
    } else {
      profile = new Profile(profileFields)
      await profile.save()
    }

    const updatedUser = await User.findById(req.userId).select('-password')
    res.json(buildCombinedResponse(updatedUser, profile))
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

    const profile = await Profile.findOne({ user_id: req.userId })
    res.json(buildCombinedResponse(user, profile))
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
    
    const filePath = path.join(__dirname, '..', 'uploads', user.resumeFileName)

    // Format filename: fullname_resume.ext with spaces replaced by underscores
    const sanitizedName = user.fullName ? user.fullName.replace(/\s+/g, '_') : 'user'
    const ext = path.extname(user.resumeFileName) || '.pdf'
    const downloadFilename = `${sanitizedName}_resume${ext}`

    res.download(filePath, downloadFilename)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/profile/:userId - get a specific user's extended profile (Task 6.1)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    const profile = await Profile.findOne({ user_id: req.params.userId })
    res.json(buildCombinedResponse(user, profile))
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(500).json({ message: err.message })
  }
})

module.exports = router