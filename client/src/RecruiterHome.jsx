import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'

// Shows a posting's pay, e.g. "$60,000 - $80,000/year" or "$25 - $32/hour"
function salaryText(job) {
  const money = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  const unit = job.salaryPeriod === 'hourly' ? '/hour' : '/year'
  if (job.salaryMin && job.salaryMax) return `${money(job.salaryMin)} - ${money(job.salaryMax)}${unit}`
  if (job.salaryMin) return `From ${money(job.salaryMin)}${unit}`
  if (job.salaryMax) return `Up to ${money(job.salaryMax)}${unit}`
  return ''
}

// "12 Applied · 3 Interview"
function statusSummary(job) {
  return Object.entries(job.statusCounts || {}).map(([status, n]) => `${n} ${status}`).join(' · ')
}

function RecruiterHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const [jobs, setJobs] = useState([])
  const [message, setMessage] = useState(location.state?.message || '')
  const [applicationsFor, setApplicationsFor] = useState(null)
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('active')
  const [appStatus, setAppStatus] = useState('')
  const [appSort, setAppSort] = useState('newest')
  const [appFrom, setAppFrom] = useState('')
  const [appTo, setAppTo] = useState('')

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

  function startCreate() {
    navigate('/recruiter/post')
  }

  function startEdit(job) {
    navigate('/recruiter/post', { state: { job } })
  }

  async function archiveOrRestore(job, action) {
    await fetch(`${API}/${job._id}/${action}`, { method: 'PATCH', headers })
    loadJobs()
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

  async function loadApplications(jobId, filters) {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    const res = await fetch(`${API}/${jobId}/applications?${params}`, { headers })
    const data = await res.json()
    if (!res.ok) return setMessage(data.message || 'Could not load applications')
    setApplications(data)
    setApplicationsFor(jobId)
  }

  function changeFilter(job, changes) {
    const next = { status: appStatus, sort: appSort, from: appFrom, to: appTo, ...changes }
    setAppStatus(next.status)
    setAppSort(next.sort)
    setAppFrom(next.from)
    setAppTo(next.to)
    loadApplications(job._id, next)
  }

  function viewApplications(job) {
    changeFilter(job, { status: '', sort: 'newest', from: '', to: '' })
  }

  async function updateApplicationStatus(appId, newStatus) {
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Failed to update application status')
        return
      }

      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
      )
      loadJobs()

    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  const activeJobs = jobs.filter((j) => j.status !== 'archived')
  const archivedJobs = jobs.filter((j) => j.status === 'archived')
  const shownJobs = tab === 'archived' ? archivedJobs : activeJobs
  const openCount = jobs.filter((j) => j.status === 'open').length
  const totalApps = activeJobs.reduce((n, j) => n + (j.applicationCount || 0), 0)

  return (
    <div className="page">
      <span className="eyebrow">Recruiter home</span>
      <h1>Your job postings</h1>

      {/* Summary tiles */}
      <div className="facts" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <div><small>Postings</small><b style={{ fontSize: 28 }}>{activeJobs.length}</b></div>
        <div><small>Open</small><b style={{ fontSize: 28 }}>{openCount}</b></div>
        <div><small>Applications</small><b style={{ fontSize: 28 }}>{totalApps}</b></div>
      </div>

      {message && <p className="notice" role="status">{message}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>My postings</h2>
        {jobs.length > 0 && (
          <button type="button" className="btn primary small" onClick={startCreate}>Create posting</button>
        )}
      </div>
      <div className="posting-actions" style={{ margin: '12px 0' }}>
        <button type="button" className={`btn small ${tab === 'active' ? 'primary' : ''}`} onClick={() => setTab('active')}>
          Active ({activeJobs.length})
        </button>
        <button type="button" className={`btn small ${tab === 'archived' ? 'primary' : ''}`} onClick={() => setTab('archived')}>
          Archived ({archivedJobs.length})
        </button>
      </div>
      {shownJobs.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p className="muted">{tab === 'archived' ? 'No archived postings.' : 'No postings yet.'}</p>
          {tab === 'active' && (
            <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={startCreate}>Create posting</button>
          )}
        </div>
      )}
      {shownJobs.map((job) => (
        <div key={job._id} className="card posting">
          <div className="posting-head">
            <div>
              <h3>{job.title}</h3>
              <div className="job-co">{job.company}{job.location && ` · ${job.location}`}</div>
            </div>
            <div className="job-meta">
              <span className={`pill ${job.status === 'open' ? 'good' : 'plain'}`}>{job.status === 'open' ? 'Open' : job.status === 'archived' ? 'Archived' : 'Closed'}</span>
              <span className="tag">{job.type}</span>
              {salaryText(job) && <span className="tag">{salaryText(job)}</span>}
              {job.deadline && <span className="tag">Apply before {new Date(job.deadline).toLocaleDateString()}</span>}
              <span>{job.applicationCount} application{job.applicationCount === 1 ? '' : 's'}</span>
              {statusSummary(job) && <span>{statusSummary(job)}</span>}
            </div>
          </div>
          <div className="posting-actions">
            {job.status !== 'archived' && <button className="btn small" onClick={() => startEdit(job)}>Edit</button>}
            {job.status !== 'archived' && <button className="btn small" onClick={() => toggleStatus(job)}>{job.status === 'open' ? 'Close' : 'Reopen'}</button>}
            <button className="btn small" onClick={() => viewApplications(job)}>View applications</button>
            {job.status === 'archived'
              ? <button className="btn small" onClick={() => archiveOrRestore(job, 'restore')}>Restore</button>
              : <button className="btn small" onClick={() => archiveOrRestore(job, 'archive')}>Archive</button>}
            <button className="btn small danger" onClick={() => deleteJob(job)}>Delete</button>
          </div>

          {applicationsFor === job._id && (
            <div style={{ marginTop: 14 }}>
              <h3>Applications</h3>
              <div className="filter-row" style={{ margin: '8px 0 12px' }}>
                <label htmlFor={`app-status-${job._id}`}>Filter by status</label>
                <select
                  id={`app-status-${job._id}`}
                  value={appStatus}
                  onChange={(e) => changeFilter(job, { status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Interview">Interview</option>
                  <option value="Offered">Offered</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
                <label htmlFor={`app-from-${job._id}`}>From</label>
                <input
                  id={`app-from-${job._id}`}
                  type="date"
                  value={appFrom}
                  onChange={(e) => changeFilter(job, { from: e.target.value })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor={`app-to-${job._id}`}>To</label>
                <input
                  id={`app-to-${job._id}`}
                  type="date"
                  value={appTo}
                  onChange={(e) => changeFilter(job, { to: e.target.value })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor={`app-sort-${job._id}`}>Sort by</label>
                <select
                  id={`app-sort-${job._id}`}
                  value={appSort}
                  onChange={(e) => changeFilter(job, { sort: e.target.value })}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Applicant name</option>
                </select>
              </div>
              {applications.length === 0 && (
                <p className="muted">{(appStatus || appFrom || appTo) ? 'No applications match this filter.' : 'No applications yet.'}</p>
              )}
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
                      value={a.status || 'Applied'}
                      onChange={(e) => updateApplicationStatus(a._id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Interview">Interview</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                      {a.status === 'Withdrawn' && <option value="Withdrawn" disabled>Withdrawn</option>}
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
export default RecruiterHome