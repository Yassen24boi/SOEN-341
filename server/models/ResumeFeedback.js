const mongoose = require('mongoose')

// US-36 (Task 36.4): one saved AI feedback result, so users can look back at earlier feedback
const resumeFeedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    resumeLabel: { type: String, default: 'CV' },
    // The job the feedback was tailored to, or null for general feedback
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    jobTitle: { type: String, default: '' },
    // 'general': strengths, weaknesses and suggestions. 'tailored': matched skills, missing skills and suggestions.
    kind: { type: String, enum: ['general', 'tailored'], required: true },
    feedback: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
)

// Supports listing a user's feedback history, newest first
resumeFeedbackSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('ResumeFeedback', resumeFeedbackSchema)