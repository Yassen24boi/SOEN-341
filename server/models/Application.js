const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeFilename: {type: String, default: null},
    coverLetterFilename: {type: String, default: null},
    status: { type: String, default: 'submitted' }
  },
  { timestamps: true }
)
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })
module.exports = mongoose.model('Application', applicationSchema)