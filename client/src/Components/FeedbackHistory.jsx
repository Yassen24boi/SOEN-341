import { useState, useEffect } from 'react'
import FeedbackResult from './FeedbackResult'

const API = 'http://localhost:5000/api/resumes/feedback/history'

// US-36 (AT-36.2): the user's earlier AI feedback, with the date, the CV and the job each was for
function FeedbackHistory() {
  const [history, setHistory] = useState([])
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(API, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        const data = await res.json()
        if (!res.ok) {
          setError(data.message || 'Could not load feedback history')
          return
        }
        setHistory(data)
        setError('')
      } catch (err) {
        console.error(err)
        setError('Could not load feedback history')
      }
    }
    loadHistory()
    // Reload when new feedback is requested on this page
    window.addEventListener('feedback-history-updated', loadHistory)
    return () => window.removeEventListener('feedback-history-updated', loadHistory)
  }, [])

  return (
    <section aria-label="Feedback history" style={{ marginTop: 24, textAlign: 'left' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>AI feedback history</h3>
      {error && <p role="alert" className="notice">{error}</p>}
      {!error && history.length === 0 && <p className="muted">No AI feedback yet. Use "Get AI feedback" on one of your CVs.</p>}
      {history.map((item) => (
        <div key={item._id} className="card" style={{ padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <strong>{item.kind === 'tailored' ? `For: ${item.jobTitle}` : 'General feedback'}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                {new Date(item.createdAt).toLocaleString()} · {item.resumeLabel}
              </div>
            </div>
            <button type="button" className="btn small" onClick={() => setOpenId(openId === item._id ? null : item._id)}>
              {openId === item._id ? 'Hide' : 'View'}
            </button>
          </div>
          {openId === item._id && (
            <FeedbackResult feedback={{ ...item.feedback, kind: item.kind, jobTitle: item.jobTitle }} />
          )}
        </div>
      ))}
    </section>
  )
}

export default FeedbackHistory