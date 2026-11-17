const mongoose = require('mongoose')

// US-30 (Task 30.1): an interview invitation sent by a recruiter for one application
const interviewSchema = new mongoose.Schema(
  {
    // One interview per application. Sending a new invitation reschedules it.
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    scheduledAt: { type: Date, required: true },
    locationOrLink: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Interview', interviewSchema)
