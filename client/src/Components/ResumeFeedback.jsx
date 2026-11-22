import { useState, useEffect } from 'react'
import FeedbackResult from './FeedbackResult'

const API = 'http://localhost:5000/api/resumes'
const JOBS_API = 'http://localhost:5000/api/jobs'
const UNAVAILABLE = 'Feedback is unavailable, try again later'

// US-33 / US-36: "Get AI feedback" button and feedback panel for one CV,
// with an optional job picker to tailor the feedback to that job (Task 36.2)
function ResumeFeedback({ resumeId }) {
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobSearch, setJobSearch] = useState('')
  const [jobOptions, setJobOptions] = useState([])
  const [jobId, setJobId] = useState('')

  // Search open jobs 300 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = jobSearch.trim()
      if (!q) {
        setJobOptions([])
        return
      }
      try {
        const res = await fetch(`${JOBS_API}?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setJobOptions(res.ok ? data.jobs : [])
      } catch (err) {
        console.error(err)
        setJobOptions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [jobSearch])

  async function getFeedback() {
    setLoading(true)
    setError('')
    setFeedback(null)
    try {
      const res = await fetch(`${API}/${resumeId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(jobId ? { jobId } : {})
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || UNAVAILABLE)
        return
      }
      setFeedback(data)
      // Lets the feedback history on the profile page show the new result
      window.dispatchEvent(new Event('feedback-history-updated'))
    } catch (err) {
      console.error(err)
      setError(UNAVAILABLE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 15, textAlign: 'left', display: 'grid', gap: 10 }}>
      <div className="field">
        <label htmlFor={`job-search-${resumeId}`}>Tailor the feedback to a job (optional)</label>
        <input
          id={`job-search-${resumeId}`}
          type="text"
          placeholder="Search jobs, e.g. React developer"
          value={jobSearch}
          onChange={(e) => setJobSearch(e.target.value)}
        />
        {jobOptions.length > 0 && (
          <select aria-label="Job to tailor the feedback to" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">General feedback (no job)</option>
            {jobOptions.map((job) => (
              <option key={job._id} value={job._id}>{job.title} · {job.company}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <button type="button" className="btn primary" onClick={getFeedback} disabled={loading}>
          {loading ? 'Getting feedback...' : jobId ? 'Get AI feedback for this job' : feedback ? 'Get new AI feedback' : 'Get AI feedback'}
        </button>
      </div>

      {loading && (
        <p role="status" className="muted" style={{ margin: 0, fontSize: 13 }}>
          The AI is reading your CV. This can take up to 30 seconds.
        </p>
      )}

      {error && <p role="alert" className="notice" style={{ margin: 0 }}>{error}</p>}

      {feedback && <FeedbackResult feedback={feedback} />}
    </div>
  )
}

export default ResumeFeedback