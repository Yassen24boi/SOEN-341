import { useState } from 'react'

const API = 'http://localhost:5000/api/applications'
const PAST_DATE = 'Interview date must be in the future'

// US-30 (Task 30.2): form the recruiter fills in when moving a candidate to "Interview"
function InterviewForm({ applicationId, candidateName, onSent, onCancel }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [locationOrLink, setLocationOrLink] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function sendInvitation() {
    setError('')
    if (!date || !time) {
      setError('Please choose a date and a time')
      return
    }
    // The date and time the recruiter picked, in their own time zone
    const scheduledAt = new Date(`${date}T${time}`)
    // AT-30.2: checked here for a quick message, and again by the server
    if (scheduledAt <= new Date()) {
      setError(PAST_DATE)
      return
    }
    if (!locationOrLink.trim()) {
      setError('Please add a location or meeting link')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`${API}/${applicationId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ scheduledAt: scheduledAt.toISOString(), locationOrLink, message })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Could not send the invitation')
        return
      }
      onSent(data.interview)
    } catch (err) {
      console.error(err)
      setError('Could not reach the server')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 8, display: 'grid', gap: 10, textAlign: 'left' }}>
      <strong>Invite {candidateName || 'this candidate'} to an interview</strong>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="field">
          <label htmlFor={`interview-date-${applicationId}`}>Date</label>
          <input id={`interview-date-${applicationId}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`interview-time-${applicationId}`}>Time</label>
          <input id={`interview-time-${applicationId}`} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`interview-where-${applicationId}`}>Location or meeting link</label>
        <input
          id={`interview-where-${applicationId}`}
          type="text"
          placeholder="e.g. https://meet.google.com/abc-defg-hij or 1455 De Maisonneuve, Room 101"
          value={locationOrLink}
          onChange={(e) => setLocationOrLink(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`interview-message-${applicationId}`}>Message (optional)</label>
        <textarea id={`interview-message-${applicationId}`} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      {error && <p role="alert" className="notice" style={{ margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn primary" onClick={sendInvitation} disabled={sending}>
          {sending ? 'Sending...' : 'Send invitation'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={sending}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default InterviewForm
