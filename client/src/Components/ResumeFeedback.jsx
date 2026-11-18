import { useState } from 'react'

const API = 'http://localhost:5000/api/resumes'
const UNAVAILABLE = 'Feedback is unavailable, try again later'

// One titled list in the feedback panel, e.g. "Strengths"
function FeedbackList({ title, items }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#333' }}>{title}</h5>
      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#444', textAlign: 'left' }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// US-33 (Task 33.5): "Get AI feedback" button and feedback panel for one CV
function ResumeFeedback({ resumeId }) {
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getFeedback() {
    setLoading(true)
    setError('')
    setFeedback(null)
    try {
      const res = await fetch(`${API}/${resumeId}/feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (!res.ok) {
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
    <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'left' }}>
      <button
        type="button"
        onClick={getFeedback}
        disabled={loading}
        style={{ width: 'auto', padding: '8px 16px', cursor: loading ? 'wait' : 'pointer', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}
      >
        {loading ? 'Getting feedback...' : feedback ? 'Get new AI feedback' : 'Get AI feedback'}
      </button>

      {loading && (
        <p role="status" style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#666' }}>
          The AI is reading your CV. This can take up to 30 seconds.
        </p>
      )}

      {error && (
        <p role="alert" style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#dc3545' }}>{error}</p>
      )}

      {feedback && (
        <div aria-label="AI feedback" style={{ marginTop: '12px', padding: '15px', backgroundColor: '#f8f5ff', border: '1px solid #d6c8f5', borderRadius: '8px' }}>
          <span style={{ padding: '3px 10px', backgroundColor: '#6f42c1', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            AI-generated
          </span>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
            Review these suggestions before changing your CV.
          </span>
          <FeedbackList title="Strengths" items={feedback.strengths} />
          <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
          <FeedbackList title="Suggestions" items={feedback.suggestions} />
        </div>
      )}
    </div>
  )
}

export default ResumeFeedback
