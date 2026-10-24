// Seed script: fills the database with sample jobs for testing and the demo.
// Run it from the server folder:
//   node seed/seedJobs.js            -> adds the sample jobs (replaces old sample jobs)
//   node seed/seedJobs.js --remove   -> removes the sample jobs and the sample recruiter
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')

// All sample jobs belong to this recruiter account, so they are easy to find and remove.
// You can also log in with it to see the jobs on the recruiter dashboard.
const SEED_EMAIL = 'seed.recruiter@careerconnect.dev'
const SEED_PASSWORD = 'Seed1234!'

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

const REQUIREMENTS = {
  Software: 'Experience with Git and at least one programming language. Good problem-solving skills.',
  Data: 'Comfortable with SQL and spreadsheets. Basic statistics knowledge.',
  Design: 'A portfolio of past work. Experience with Figma or similar tools.',
  Marketing: 'Strong writing skills. Experience with social media platforms.',
  Finance: 'Studying or graduated in finance, accounting or economics. Strong Excel skills.',
  Other: 'Good communication skills and a positive attitude.'
}

// 25 open jobs (3 pages of 10), plus 1 closed and 1 expired job that should NOT show up.
const sampleJobs = [
  { title: 'Java Developer', company: 'Maple Tech', location: 'Montreal', category: 'Software', type: 'full-time', salaryMin: 75000, salaryMax: 95000 },
  { title: 'UX Designer', company: 'Northwind Studios', location: 'Montreal', category: 'Design', type: 'full-time', salaryMin: 65000, salaryMax: 85000 },
  { title: 'Frontend Developer Intern', company: 'Lumen Labs', location: 'Montreal', category: 'Software', type: 'internship', salaryMin: 40000, salaryMax: 48000 },
  { title: 'Backend Developer', company: 'Harbour Systems', location: 'Toronto', category: 'Software', type: 'full-time', salaryMin: 85000, salaryMax: 110000 },
  { title: 'Data Analyst', company: 'Summit Bank', location: 'Toronto', category: 'Data', type: 'full-time', salaryMin: 60000, salaryMax: 75000 },
  { title: 'Data Science Intern', company: 'Lumen Labs', location: 'Montreal', category: 'Data', type: 'internship', salaryMin: 42000, salaryMax: 50000 },
  { title: 'Machine Learning Engineer', company: 'Cortex AI', location: 'Toronto', category: 'Data', type: 'full-time', salaryMin: 110000, salaryMax: 140000 },
  { title: 'Graphic Designer', company: 'Pixel Street', location: 'Montreal', category: 'Design', type: 'part-time', salaryMin: 30000, salaryMax: 38000 },
  { title: 'Product Designer', company: 'Cedar Apps', location: 'Vancouver', category: 'Design', type: 'full-time', salaryMin: 80000, salaryMax: 100000 },
  { title: 'Marketing Coordinator', company: 'Riverside Retail', location: 'Montreal', category: 'Marketing', type: 'full-time', salaryMin: 50000, salaryMax: 60000 },
  { title: 'Social Media Intern', company: 'Coastline Apparel', location: 'Vancouver', category: 'Marketing', type: 'internship', salaryMin: 35000, salaryMax: 40000 },
  { title: 'Digital Marketing Specialist', company: 'Maple Tech', location: 'Remote', category: 'Marketing', type: 'contract', salaryMin: 55000, salaryMax: 70000 },
  { title: 'Financial Analyst', company: 'Summit Bank', location: 'Toronto', category: 'Finance', type: 'full-time', salaryMin: 65000, salaryMax: 80000 },
  { title: 'Accounting Intern', company: 'Brightline Partners', location: 'Montreal', category: 'Finance', type: 'internship', salaryMin: 38000, salaryMax: 44000 },
  { title: 'Investment Analyst', company: 'Laurentian Capital', location: 'Montreal', category: 'Finance', type: 'full-time', salaryMin: 70000, salaryMax: 90000 },
  { title: 'Software Developer Intern', company: 'Harbour Systems', location: 'Montreal', category: 'Software', type: 'internship', salaryMin: 45000, salaryMax: 52000 },
  { title: 'Full Stack Developer', company: 'Cedar Apps', location: 'Quebec City', category: 'Software', type: 'full-time', salaryMin: 80000, salaryMax: 100000 },
  { title: 'DevOps Engineer', company: 'Cloudnine', location: 'Vancouver', category: 'Software', type: 'full-time', salaryMin: 95000, salaryMax: 120000 },
  { title: 'Mobile Developer', company: 'Transitway', location: 'Montreal', category: 'Software', type: 'contract', salaryMin: 70000, salaryMax: 90000 },
  { title: 'QA Tester', company: 'Northwind Studios', location: 'Montreal', category: 'Software', type: 'part-time', salaryMin: 35000, salaryMax: 45000 },
  { title: 'Database Administrator', company: 'Hydra Energy', location: 'Montreal', category: 'Data', type: 'full-time', salaryMin: 75000, salaryMax: 95000 },
  { title: 'Business Intelligence Developer', company: 'Skyway Airlines', location: 'Montreal', category: 'Data', type: 'contract', salaryMin: 70000, salaryMax: 85000 },
  { title: 'Customer Support Specialist', company: 'Maple Tech', location: 'Remote', category: 'Other', type: 'part-time', salaryMin: 32000, salaryMax: 38000 },
  { title: 'IT Support Technician', company: 'Riverside College', location: 'Montreal', category: 'Other', type: 'full-time', salaryMin: 48000, salaryMax: 58000 },
  { title: 'Project Coordinator', company: 'Aerotech', location: 'Montreal', category: 'Other', type: 'full-time', salaryMin: 55000, salaryMax: 68000 },

  // These two should be hidden from job seekers (US-08, AT-08.2)
  { title: 'Embedded Developer', company: 'Aerotech', location: 'Montreal', category: 'Software', type: 'full-time', salaryMin: 80000, salaryMax: 100000, status: 'closed' },
  { title: 'Web Developer Intern', company: 'Lumen Labs', location: 'Montreal', category: 'Software', type: 'internship', salaryMin: 40000, salaryMax: 46000, deadline: daysFromNow(-5) }
]

// Fills in the fields that are the same pattern for every job.
// Anything already set on the job (like status or deadline) wins over these defaults.
function buildJob(job, recruiterId) {
  return {
    recruiter: recruiterId,
    description: `${job.company} is hiring for the ${job.title} position in ${job.location}. You will join a friendly team, work on real projects and learn from experienced colleagues.`,
    requirements: REQUIREMENTS[job.category],
    deadline: daysFromNow(30),
    ...job
  }
}

async function main() {
  await mongoose.connect(process.env.DATABASE_URL)
  console.log('Connected to MongoDB')

  let recruiter = await User.findOne({ email: SEED_EMAIL })

  if (process.argv.includes('--remove')) {
    if (!recruiter) {
      console.log('No sample data found, nothing to remove')
      return
    }
    const jobIds = (await Job.find({ recruiter: recruiter._id }).select('_id')).map((j) => j._id)
    await Application.deleteMany({ job: { $in: jobIds } })
    await Job.deleteMany({ recruiter: recruiter._id })
    await recruiter.deleteOne()
    console.log(`Removed ${jobIds.length} sample jobs and the sample recruiter`)
    return
  }

  if (!recruiter) {
    recruiter = await User.create({
      fullName: 'Sample Recruiter',
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      role: 'recruiter'
    })
    console.log(`Created sample recruiter: ${SEED_EMAIL} / ${SEED_PASSWORD}`)
  }

  // Start fresh so running the script twice doesn't create duplicates
  await Job.deleteMany({ recruiter: recruiter._id })
  const jobs = sampleJobs.map((job) => buildJob(job, recruiter._id))
  await Job.insertMany(jobs)
  console.log(`Added ${jobs.length} sample jobs (25 open, 1 closed, 1 expired)`)
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
