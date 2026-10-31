import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'
const emptyForm = {
  title: '', company: '', location: '', type: 'full-time', description: '',
  salaryPeriod: 'yearly', salaryMin: '', salaryMax: '', deadline: ''
}

// Shows a posting's pay, e.g. "$60,000 - $80,000/year" or "$25 - $32/hour"
function salaryText(job) {
  const money = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  const unit = job.salaryPeriod === 'hourly' ? '/hour' : '/year'
  if (job.salaryMin && job.salaryMax) return `${money(job.salaryMin)} - ${money(job.salaryMax)}${unit}`
  if (job.salaryMin) return `From ${money(job.salaryMin)}${unit}`
  if (job.salaryMax) return `Up to ${money(job.salaryMax)}${unit}`
  return ''
}

// Turns a saved deadline into the "YYYY-MM-DD" text a date input needs (in the user's own time zone)
function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function RecruiterDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [applicationsFor, setApplicationsFor] = useState(null)
  const [applications, setApplications] = useState([])

  async function loadJobs() {
    const res = await fetch(`${API}/mine`, { headers })
    if (res.status === 401) return navigate('/login')
    const data = await res.json()
    if (!res.ok) return setMessage(data.message || 'Could not load postings')
    setJobs(data)
  }

  useEffect(() => {
    if (!token) navigate('/login')
    //eslint-disable-next-line react-hooks/set-state-in-effect
    else loadJobs()
    // eslint-disable-next-line
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const url = editingId ? `${API}/${editingId}` : API
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) return setMessage(data.message || 'Something went wrong')
    setMessage(editingId ? 'Posting updated' : 'Posting created')
    setForm(emptyForm)
    setEditingId(null)
    loadJobs()
  }

  function startEdit(job) {
    setEditingId(job._id)
    setForm({
      title: job.title,
      company: job.company,
      location: job.location || '',
      type: job.type,
      description: job.description,
      salaryPeriod: job.salaryPeriod || 'yearly',
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      deadline: toDateInput(job.deadline)
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleStatus(job) {
    const status = job.status === 'open' ? 'closed' : 'open'
    await fetch(`${API}/${job._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) })
    loadJobs()
  }

  async function deleteJob(job) {
    if (!window.confirm(`Delete "${job.title}"? This also removes its applications.`)) return
    await fetch(`${API}/${job._id}`, { method: 'DELETE', headers })
    if (applicationsFor === job._id) setApplicationsFor(null)
    loadJobs()
  }

  async function viewApplications(job) {
    const res = await fetch(`${API}/${job._id}/applications`, { headers })
    const data = await res.json()
    if (!res.ok) return setMessage(data.message || 'Could not load applications')
    setApplications(data)
    setApplicationsFor(job._id)
  }

  async function updateApplicationStatus(appId, newStatus){
    try{
      const res = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({status: newStatus})
      })
      const data = await res.json()
      if(!res.ok){
        alert(data.message || 'Failed to update application status')
        return
      }

      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
      )

    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  const openCount = jobs.filter((j) => j.status === 'open').length
  const totalApps = jobs.reduce((n, j) => n + (j.applicationCount || 0), 0)

  return (
    <div className="page">
      <span className="eyebrow">Recruiter dashboard</span>
      <h1>Your job postings</h1>

      {/* Summary tiles */}
      <div className="facts" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <div><small>Postings</small><b style={{ fontSize: 28 }}>{jobs.length}</b></div>
        <div><small>Open</small><b style={{ fontSize: 28 }}>{openCount}</b></div>
        <div><small>Applications</small><b style={{ fontSize: 28 }}>{totalApps}</b></div>
      </div>

      <h2>{editingId ? 'Edit posting' : 'Create a job posting'}</h2>
      <form onSubmit={handleSubmit} className="card dash-form">
        <div className="row">
          <input name="title" aria-label="Job title" placeholder="Job title" value={form.title} onChange={handleChange} required style={{ flex: '2 1 220px', width: 'auto' }} />
          <input name="company" aria-label="Company" placeholder="Company" value={form.company} onChange={handleChange} required style={{ flex: '1 1 180px', width: 'auto' }} />
        </div>
        <div className="row">
          <input name="location" aria-label="Location" placeholder="Location" value={form.location} onChange={handleChange} style={{ flex: '2 1 220px', width: 'auto' }} />
          <select name="type" aria-label="Job type" value={form.type} onChange={handleChange} style={{ flex: '1 1 180px', width: 'auto' }}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <div className="row">
          <select name="salaryPeriod" aria-label="Pay type" value={form.salaryPeriod} onChange={handleChange} style={{ flex: '1 1 180px', width: 'auto' }}>
            <option value="yearly">Yearly salary</option>
            <option value="hourly">Hourly wage</option>
          </select>
          <input name="salaryMin" type="number" min="0" step="any" aria-label="Minimum pay" placeholder={form.salaryPeriod === 'hourly' ? 'Min $ per hour (optional)' : 'Min $ per year (optional)'} value={form.salaryMin} onChange={handleChange} style={{ flex: '1 1 140px', width: 'auto' }} />
          <input name="salaryMax" type="number" min="0" step="any" aria-label="Maximum pay" placeholder={form.salaryPeriod === 'hourly' ? 'Max $ per hour (optional)' : 'Max $ per year (optional)'} value={form.salaryMax} onChange={handleChange} style={{ flex: '1 1 140px', width: 'auto' }} />
        </div>
        <div className="row">
          <div className="field" style={{ flex: '1 1 220px' }}>
            <label htmlFor="deadline">Apply before (optional)</label>
            <input id="deadline" name="deadline" type="date" value={form.deadline} onChange={handleChange} />
          </div>
        </div>
        <textarea name="description" aria-label="Description" placeholder="Description" rows={5} value={form.description} onChange={handleChange} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn primary">{editingId ? 'Save changes' : 'Post job'}</button>
          {editingId && (
            <button type="button" className="btn" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {message && <p className="notice" role="status">{message}</p>}

      <h2>My postings</h2>
      {jobs.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p className="muted">No postings yet. Create your first one above.</p>
        </div>
      )}
      {jobs.map((job) => (
        <div key={job._id} className="card posting">
          <div className="posting-head">
            <div>
              <h3>{job.title}</h3>
              <div className="job-co">{job.company}{job.location && ` · ${job.location}`}</div>
            </div>
            <div className="job-meta">
              <span className={`pill ${job.status === 'open' ? 'good' : 'plain'}`}>{job.status === 'open' ? 'Open' : 'Closed'}</span>
              <span className="tag">{job.type}</span>
              {salaryText(job) && <span className="tag">{salaryText(job)}</span>}
              {job.deadline && <span className="tag">Apply before {new Date(job.deadline).toLocaleDateString()}</span>}
              <span>{job.applicationCount} application{job.applicationCount === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="posting-actions">
            <button className="btn small" onClick={() => startEdit(job)}>Edit</button>
            <button className="btn small" onClick={() => toggleStatus(job)}>{job.status === 'open' ? 'Close' : 'Reopen'}</button>
            <button className="btn small" onClick={() => viewApplications(job)}>View applications</button>
            <button className="btn small danger" onClick={() => deleteJob(job)}>Delete</button>
          </div>

          {applicationsFor === job._id && (
            <div style={{ marginTop: 14 }}>
              <h3>Applications</h3>
              {applications.length === 0 && <p className="muted">No applications yet.</p>}
              {applications.map((a) => (
                <div key={a._id} className="app-row">
                  <div><strong>{a.applicant?.name || a.applicant?.fullName || a.applicant?.email}</strong></div>
                  <div className="muted">{a.applicant?.email}</div>
                  {a.applicant?.headline && <div className="muted">{a.applicant.headline}</div>}
                  <div className="muted" style={{ fontSize: 13 }}>Applied on {new Date(a.createdAt).toLocaleDateString()}</div>

                  <div className="status-row">
                    <label htmlFor={`status-${a._id}`}>Status</label>
                    <select
                      id={`status-${a._id}`}
                      value={a.status || 'Pending'}
                      onChange={(e) => updateApplicationStatus(a._id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Interview">Interview</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {a.resumeFilename ? (
                    <a
                      href={`http://localhost:5000/uploads/${a.resumeFilename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      Download resume ({a.resumeFilename})
                    </a>
                  ) : (
                    <div className="muted" style={{ fontSize: 13 }}>No specific resume file attached</div>
                  )}
                  {a.coverLetterFilename ? (
                    <a
                      href={`http://localhost:5000/uploads/${a.coverLetterFilename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      Download cover letter ({a.coverLetterFilename})
                    </a>
                  ) : (
                    <div className="muted" style={{ fontSize: 13 }}>No cover letter attached</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
export default RecruiterDashboard