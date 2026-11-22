import { useState } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs/recommended'
const UNAVAILABLE = 'Recommendations are unavailable, try again later'

// US-34 (Task 34.5): "Recommended for you" section on the Jobs page, for logged-in job seekers
function RecommendedJobs() {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsProfile, setNeedsProfile] = useState(false)

  const token = localStorage.getItem('token')
  if (!token || localStorage.getItem('role') !== 'jobseeker') return null

  async function loadRecommendations() {
    setLoading(true)
    setError('')
    setNeedsProfile(false)
    setRecommendations(null)
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.needsProfile) {
        // AT-34.2: nothing to match on yet
        setNeedsProfile(true)
        setError(data.message)
        return
      }
      if (!res.ok) {
        setError(data.message || UNAVAILABLE)
        return
      }
      setRecommendations(data.recommendations)
    } catch (err) {
      console.error(err)
      setError(UNAVAILABLE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card" aria-label="Recommended for you" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Recommended for you</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>Jobs our AI picked from your skills and CV.</p>
        </div>
        <button type="button" className="btn primary" onClick={loadRecommendations} disabled={loading}>
          {loading ? 'Finding matches...' : recommendations ? 'Refresh matches' : 'Show my matches'}
        </button>
      </div>

      {loading && <p role="status" className="muted">The AI is comparing your profile with open jobs. This can take up to 30 seconds.</p>}

      {error && (
        <p role="alert" className="notice">
          {error}{' '}
          {needsProfile && <Link to="/profile/edit">Complete your profile</Link>}
        </p>
      )}

      {recommendations && recommendations.length === 0 && (
        <p className="muted">No strong matches right now. Adding more skills to your profile or uploading a CV can help.</p>
      )}

      {recommendations && recommendations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span className="pill info">AI-generated</span>
          <div style={{ marginTop: 10 }}>
            {recommendations.map(({ job, matchScore, reason }) => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="card job-card">
                <div>
                  <h3>{job.title}</h3>
                  <div className="job-co">{job.company}{job.location && ` · ${job.location}`}</div>
                </div>
                <div className="job-meta">
                  <span className="pill good">{matchScore}% match</span>
                  {job.category && <span className="tag">{job.category}</span>}
                </div>
                <p className="muted" style={{ margin: 0 }}>{reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default RecommendedJobs