import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'
const emptyForm = { title: '', company: '', location: '', type: 'full-time', description: '' }

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
      description: job.description
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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'left' }}>
      <h1>Recruiter Dashboard</h1>

      <h2>{editingId ? 'Edit posting' : 'Create a job posting'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <input name="title" placeholder="Job title" value={form.title} onChange={handleChange} required />
        <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>
        <textarea name="description" placeholder="Description" rows={5} value={form.description} onChange={handleChange} required />
        <div>
          <button type="submit">{editingId ? 'Save changes' : 'Post job'}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {message && <p>{message}</p>}

      <h2>My postings:</h2>
      {jobs.length === 0 && <p>No postings yet.</p>}
      {jobs.map((job) => (
        <div key={job._id} style={{ border: '1px solid #888', borderRadius: 6, padding: 12, marginBottom: 10 }}>
          <strong>{job.title}</strong> at {job.company} {job.location && `(${job.location})`}
          <div>
            {job.type} | {job.status.toUpperCase()} | {job.applicationCount} application(s)
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => startEdit(job)}>Edit</button>
            <button onClick={() => toggleStatus(job)}>{job.status === 'open' ? 'Close' : 'Reopen'}</button>
            <button onClick={() => viewApplications(job)}>View applications</button>
            <button onClick={() => deleteJob(job)}>Delete</button>
          </div>

          {applicationsFor === job._id && (
            <div style={{ marginTop: 10 }}>
              <h3>Applications</h3>
              {applications.length === 0 && <p>No applications yet.</p>}
              {applications.map((a) => (
                <div key={a._id} style={{ borderTop: '1px solid #555', padding: '6px 0' }}>
                  <div>Name: {a.applicant?.name || a.applicant?.fullName || a.applicant?.email}</div>
                  <div>Email: {a.applicant?.email}</div>
                  {a.applicant?.headline && <div>Headline: {a.applicant.headline}</div>}
                  <div>Applied on: {new Date(a.createdAt).toLocaleDateString()}</div>

                  {a.resumeFilename ? (
                    <div style={{marginTop: 6}}>
                      <a
                        href={`http://localhost:5000/uploads/${a.resumeFilename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{color: '#4dabf7', textDecoration: 'underline'}}
                      >
                        Download Attached Resume ({a.resumeFilename})
                      </a>
                    </div>
                  ) : (
                    <div style={{fontSize: '13px', color: '#888', marginTop: 4}}>
                      No specific resume file attached
                    </div>
                  )}
                  {a.coverLetterFilename ? (
                    <div style={{marginTop: 6}}>
                      <a
                        href={`http://localhost:5000/uploads/${a.coverLetterFilename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{color: '#4dabf7', textDecoration: 'underline'}}
                      >
                        Download Cover Letter ({a.coverLetterFilename})
                      </a>
                    </div>
                  ) : (
                    <div style={{fontSize: '13px', color: '#888', marginTop: 4}}>
                      No cover letter attached
                    </div>
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