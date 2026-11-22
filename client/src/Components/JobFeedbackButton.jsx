import { useState } from 'react'
import { Link } from 'react-router-dom'
import FeedbackResult from './FeedbackResult'

const API = 'http://localhost:5000/api/resumes/default/feedback'
const UNAVAILABLE = 'Feedback is unavailable, try again later'

// US-36 (Task 36.5): "Get AI feedback for this job" on the job details page.
// Compares the job seeker's default CV with this job.
function JobFeedbackButton({ jobId }) {
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsCv, setNeedsCv] = useState(false)

  const token = localStorage.getItem('token')
  if (!token || localStorage.getItem('role') !== 'jobseeker') return null

  async function getFeedback() {
    setLoading(true)
    setError('')
    setNeedsCv(false)
    setFeedback(null)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId })
      })
      const data = await res.json()
      if (!res.ok) {
        setNeedsCv(res.status === 404 && data.message === 'Upload a CV to your profile first')
        setError(data.message || UNAVAILABLE)
        return
      }
      setFeedback(data)
    } catch (err) {
      console.error(err)
      setError(UNAVAILABLE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card panel" style={{ marginTop: 20 }}>
      <h3 style={{ marginTop: 0 }}>Is your CV ready for this job?</h3>
      <p className="muted" style={{ marginTop: 0 }}>Our AI compares your default CV with this job and shows what to change before you apply.</p>
      <button type="button" className="btn" onClick={getFeedback} disabled={loading}>
        {loading ? 'Getting feedback...' : 'Get AI feedback for this job'}
      </button>
      {loading && <p role="status" className="muted">The AI is reading your CV. This can take up to 30 seconds.</p>}
      {error && (
        <p role="alert" className="notice">
          {error}{' '}
          {needsCv && <Link to="/profile">Go to your profile</Link>}
        </p>
      )}
      {feedback && <FeedbackResult feedback={feedback} />}
    </div>
  )
}

export default JobFeedbackButton