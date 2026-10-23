require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')
const jobRoutes = require('./routes/jobRoutes')

const app = express()

// Only connect to DB if not running tests
if (process.env.NODE_ENV !== 'test') {
  connectDB()
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/jobs', jobRoutes)

// Only listen on port if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

// Export app for testing purposes
module.exports = app