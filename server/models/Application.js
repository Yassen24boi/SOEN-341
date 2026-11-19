const mongoose = require('mongoose')

const statusHistorySchema = new mongoose.Schema({
  fromStatus: {type: String, required: true},
  toStatus: {type: String, required: true},
  changedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  changedAt: {type: Date, default: Date.now}
}, {_id: false})

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeFilename: {type: String, default: null},
    coverLetterFilename: {type: String, default: null},
    status: { type: String, default: 'Applied' },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  { timestamps: true }
)

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })
module.exports = mongoose.model('Application', applicationSchema)