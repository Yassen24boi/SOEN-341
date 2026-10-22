const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema(
    {
      recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    type: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], default: 'full-time' },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
  },
  { timestamps: true }
)  
module.exports = mongoose.model('Job', jobSchema)
