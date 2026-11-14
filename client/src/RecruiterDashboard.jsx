import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'
const emptyForm = {
  title: '', company: '', location: '', type: 'full-time', category: '', description: '', requirements: '',
  salaryPeriod: 'yearly', salaryMin: '', salaryMax: '', deadline: ''
}

// Turns a saved deadline into the "YYYY-MM-DD" text a date input needs (in the user's own time zone)
function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formFromJob(job) {
  return {
    title: job.title,
    company: job.company,
    location: job.location || '',
    type: job.type,
    category: job.category || '',
    description: job.description,
    requirements: job.requirements || '',
    salaryPeriod: job.salaryPeriod || 'yearly',
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    deadline: toDateInput(job.deadline)
  }
}

function RecruiterDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // When the recruiter clicked Edit on the home page, the posting arrives here
  const editingJob = location.state?.job || null
  const editingId = editingJob ? editingJob._id : null

  const [form, setForm] = useState(editingJob ? formFromJob(editingJob) : emptyForm)
  const [categories, setCategories] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) navigate('/login')
    fetch(`${API}/filters`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
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
    navigate('/recruiter', { state: { message: editingId ? 'Posting updated' : 'Posting created' } })
  }

  return (
    <div className="page">
      <span className="eyebrow">Recruiter dashboard</span>
      <h1>{editingId ? 'Edit posting' : 'Create a job posting'}</h1>

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
          <select name="category" aria-label="Category" value={form.category} onChange={handleChange} style={{ flex: '1 1 220px', width: 'auto' }}>
            <option value="">Category (optional)</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
        <textarea name="requirements" aria-label="Requirements" placeholder="Requirements (optional)" rows={4} value={form.requirements} onChange={handleChange} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn primary">{editingId ? 'Save changes' : 'Post job'}</button>
          <button type="button" className="btn" onClick={() => navigate('/recruiter')}>Cancel</button>
        </div>
      </form>
      {message && <p className="notice" role="status">{message}</p>}
    </div>
  )
}
export default RecruiterDashboard