const express = require('express')
const multer = require('multer')
const path = require('path')
const User = require('../models/User')
const Profile = require('../models/Profile')
const requireAuth = require('../middleware/auth')
const fs = require('fs');

const router = express.Router()

// Configure Multer to keep a clean, recognizable filename with a unique timestamp prefix
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, '_')
    cb(null, cleanName)
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

  return { ...userObj, ...profileObj }
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
    
    const user = await User.findById(req.userId)
    const label = req.body.label || 'Software CV'
    const isFirstCV = user.resumes.length === 0

    // If it's the first CV, automatically make it the default
    user.resumes.push({
      filename: req.file.filename,
      label: label,
      isDefault: isFirstCV
    })

    await user.save()
    const updatedUser = await User.findById(req.userId).select('-password')
    const profile = await Profile.findOne({ user_id: req.userId })
    res.json(buildCombinedResponse(updatedUser, profile))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/profile/resume/:id/default - Set a specific CV as default
router.patch('/resume/:id/default', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const resumeId = req.params.id

    const resumeExists = user.resumes.some(r => r._id.toString() === resumeId)
    if (!resumeExists) return res.status(404).json({ message: 'Resume not found' })

    // Set all to false, then the target to true
    user.resumes.forEach(r => {
      r.isDefault = (r._id.toString() === resumeId)
    })

    await user.save()
    const updatedUser = await User.findById(req.userId).select('-password')
    const profile = await Profile.findOne({ user_id: req.userId })
    res.json(buildCombinedResponse(updatedUser, profile))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/profile/resume/:id - Delete CV & assign new default if needed
router.delete('/resume/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const resumeIndex = user.resumes.findIndex(r => r._id.toString() === req.params.id)
    
    if (resumeIndex === -1) return res.status(404).json({ message: 'Resume not found' })

    const deletedCV = user.resumes[resumeIndex]
    user.resumes.splice(resumeIndex, 1)

    // If the deleted CV was the default, make the most recent remaining CV the default
    if (deletedCV.isDefault && user.resumes.length > 0) {
      // Sort descending by uploadedAt and set the first one to default
      user.resumes.sort((a, b) => b.uploadedAt - a.uploadedAt)
      user.resumes[0].isDefault = true
    }

    await user.save()
    
    // Cleanup file from server
    const filePath = path.join(__dirname, '..', 'uploads', deletedCV.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    const updatedUser = await User.findById(req.userId).select('-password')
    const profile = await Profile.findOne({ user_id: req.userId })
    res.json(buildCombinedResponse(updatedUser, profile))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/profile/resume/:filename - download or preview a specific resume
router.get('/resume/:filename', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const targetResume = user.resumes.find(r => r.filename === req.params.filename)
    
    if (!targetResume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', targetResume.filename)
    const sanitizedName = user.fullName ? user.fullName.replace(/\s+/g, '_') : 'user'
    const ext = path.extname(targetResume.filename) || '.pdf'
    const downloadFilename = `${sanitizedName}_${targetResume.label.replace(/\s+/g, '_')}${ext}`

    res.download(filePath, downloadFilename)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/profile/:userId - get a specific user's extended profile
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