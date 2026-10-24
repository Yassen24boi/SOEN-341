const mongoose = require('mongoose')

const JOB_CATEGORIES = ['Software', 'Data', 'Design', 'Marketing', 'Finance', 'Other']

const jobSchema = new mongoose.Schema(
    {
      recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    category: { type: String, enum: JOB_CATEGORIES, default: 'Other' },
    type: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], default: 'full-time' },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    description: { type: String, required: true },
    requirements: { type: String, default: '' },
    deadline: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
  },
  { timestamps: true }
)  
module.exports = mongoose.model('Job', jobSchema)
module.exports.JOB_CATEGORIES = JOB_CATEGORIES

