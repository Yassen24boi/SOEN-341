import { useEffect, useState} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import InterviewForm from './Components/InterviewForm'

const JOBS_API = 'http://localhost:5000/api/jobs'
const APPS_API = 'http://localhost:5000/api/applications'
const UPLOADS_BASE = 'http://localhost:5000/uploads'

function isPdf(filename) {
    return typeof filename === 'string' && filename.toLowerCase().endsWith('.pdf')
}

function ApplicationDetails(){
    const {applicationId} = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const token = localStorage.getItem('token')
    const headers = {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}

    const [application, setApplication] = useState(null)
    const [filteredIds, setFilteredIds] = useState(location.state?.filteredIds || [])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showInterviewForm, setShowInterviewForm] = useState(false)
    const [notice, setNotice] = useState('')

    useEffect(() => {
        if(!token) {
            navigate('/login')
            return
        }

        let cancelled = false

        async function loadApplication() {
            try{
                setLoading(true)
                setError('')
                setShowInterviewForm(false)

                const res = await fetch(`${APPS_API}/${applicationId}`, {headers})
                if (res.status === 401) {
                    navigate('/login')
                    return
                }

                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    if(!cancelled) {
                        setError(`Unexpected response (${res.status}).`)
                    }
                    return
                }

                const data = await res.json()
                if (!res.ok){
                    if (!cancelled) setError(data.message || 'Could not load application')
                    return
                }

                if(!cancelled){
                    setApplication(data)
                }

                if((!location.state?.filteredIds || location.state.filteredIds.length === 0) && data.job?._id) {
                    const listRes = await fetch(`${JOBS_API}/${data.job._id}/applications`, {headers})
                    if (listRes.ok) {
                        const listData = await listRes.json()
                        if (!cancelled){
                            setFilteredIds(listData.map((item) => item._id))
                        }
                    }
                }
            }
            catch (err) {
                console.error(err)
                if(!cancelled) setError('Error loading application details.')
            } finally {
                if(!cancelled) setLoading(false)
            }
        }

        loadApplication()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId])

    async function handleStatusChange(newStatus) {
        setNotice('')

        if(newStatus === 'Interview'){
            setShowInterviewForm(true)
            return
        }

        setShowInterviewForm(false)

        try{
            const res = await fetch(`${APPS_API}/${applicationId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({status: newStatus})
            })
            const data = await res.json()
            if(!res.ok){
                alert(data.message || 'Failed to update application status')
                return
            }
            setApplication((prev) => ({ ...prev, status: newStatus}))
        } catch (err) {
            console.error(err)
            alert('Error updating status')
        }
    }

    const currentIndex = filteredIds.indexOf(applicationId)
    const prevId = currentIndex > 0 ? filteredIds[currentIndex - 1] : null
    const nextId = currentIndex !== -1 && currentIndex < filteredIds.length - 1 ? filteredIds[currentIndex + 1] : null

    function goToApplication(targetId) {
        if(!targetId) return
        navigate(`/recruiter/applications/${targetId}`, {
            state: {filteredIds}
        })
    }

    const jobId = application?.job?._id || location.state?.jobId

    if (loading) {
        return (
            <div className="page">
                <p className="muted">Loading candidate application...</p>
            </div>
        )
    }

    if (error || !application) {
        return (
            <div className = "page">
                <button
                    type="button"
                    className="btn small"
                    onClick={() => navigate('/recruiter', {state: jobId ? {openJobId: jobId} : undefined})}>
                    ← Back to postings
                </button>
                <p className='notice' role="alert" style={{marginTop: 16}}>
                    {error || 'Application not found.'}
                </p>
            </div>
        )
    }

    const applicant = application.applicant || {}
    const displayName = applicant.fullName || applicant.name || applicant.email || 'Candidate'

    const excludedKeys = new Set([
    '_id', '__v', 'password', 'role', 'fullName', 'name', 'email',
    'headline', 'phone', 'location', 'createdAt', 'updatedAt', 'defaultResumeFilename', 'resumes'
    ])
    const extraProfileFields = Object.entries(applicant).filter(
        ([key, val]) =>
            !excludedKeys.has(key) &&
            val !== null &&
            val !== undefined &&
            val !== '' &&
            (!Array.isArray(val) || val.length > 0)
    )

    return (
        <div className='page'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
                    <button
                        type="button"
                        className='btn small'
                        onClick={() => navigate('/recruiter', {state: jobId ? {openJobId: jobId} : undefined})}>
                        ← Back to applications
                    </button>

                    <button
                        type="button"
                        className='btn small'
                        disabled={!prevId}
                        onClick={() => goToApplication(prevId)}>
                        ← Previous
                    </button>
                    <button
                        type="button"
                        className='btn small'
                        disabled={!nextId}
                        onClick={() => goToApplication(nextId)}>
                        Next →
                    </button>
                    {currentIndex !== -1 && (
                        <span className='muted' style={{fontSize: 13}}>
                            {currentIndex + 1} of {filteredIds.length}
                        </span>
                    )}
                </div>

                <div className="status-row" style={{ margin: 0 }}>
                    <label htmlFor="detail-app-status">Status</label>
                    <select
                        id="detail-app-status"
                        value={application.status || 'Applied'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Interview">Interview</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                        {application.status === 'Withdrawn' && (
                        <option value="Withdrawn" disabled>Withdrawn</option>
                        )}
                    </select>
                </div>
            </div>

            {notice && (
                <p className="notice" role="status" style={{marginBottom: 16}}>
                    {notice}
                </p>
            )}

            {showInterviewForm && (
                <div className="card" style={{marginBottom: 16}}>
                    <InterviewForm
                        applicationId={application._id}
                        candidateName={displayName}
                        onCancel={() => setShowInterviewForm(false)}
                        onSent={() => {
                            setApplication((prev) => ({...prev, status: 'Interview'}))
                            setShowInterviewForm(false)
                            setNotice(`Interview invitation sent to ${displayName}.`)
                        }}
                    />
                </div>
            )}

            <span className="eyebrow">
                {application.job?.title ? `Application for ${application.job.title}` : 'Candidate Application'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{displayName}</h1>
                <span className={`pill ${application.status === 'Offered' ? 'good' : 'plain'}`}>
                    {application.status || 'Applied'}
                </span>
            </div>
            {applicant.headline && (
                <p className="muted" style={{ fontSize: 16, marginTop: 6 }}>{applicant.headline}</p>
            )}

            {/* Profile Section (US-04) */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Candidate Profile</h2>
        <div className="facts" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <small>Full Name</small>
            <div><strong>{displayName}</strong></div>
          </div>
          {applicant.email && (
            <div>
              <small>Email</small>
              <div><a href={`mailto:${applicant.email}`}>{applicant.email}</a></div>
            </div>
          )}
          <div>
            <small>Applied On</small>
            <div>{new Date(application.createdAt).toLocaleDateString()}</div>
          </div>
          {applicant.phone && (
            <div>
              <small>Phone</small>
              <div>{applicant.phone}</div>
            </div>
          )}
          {applicant.location && (
            <div>
              <small>Location</small>
              <div>{applicant.location}</div>
            </div>
          )}
        </div>

        {extraProfileFields.map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
          return (
            <div key={key} style={{ marginTop: 14 }}>
              <small className="muted" style={{ display: 'block', marginBottom: 4 }}>{label}</small>
              {Array.isArray(value) ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {value.map((item, idx) => (
                    <span key={idx} className="tag">
                      {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </span>
                  ))}
                </div>
              ) : typeof value === 'object' ? (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{String(value)}</div>
              )}
            </div>
          )
        })}
      </section>

      {/* Task 23.2: In-browser CV Preview */}
      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>CV / Resume</h2>
          {application.resumeFilename && (
            <a
              className="btn small primary"
              href={`${UPLOADS_BASE}/${application.resumeFilename}`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              Download CV ({application.resumeFilename})
            </a>
          )}
        </div>

        {application.resumeFilename ? (
          <div style={{ marginTop: 14 }}>
            {isPdf(application.resumeFilename) ? (
              <iframe
                title="Candidate CV Preview"
                src={`${UPLOADS_BASE}/${application.resumeFilename}`}
                style={{ width: '100%', height: 600, border: '1px solid #ddd', borderRadius: 8 }}
              />
            ) : (
              <p className="muted">
                In-browser preview is available for PDF files. Download{' '}
                <strong>{application.resumeFilename}</strong> using the button above.
              </p>
            )}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>No CV attached to this application.</p>
        )}
      </section>

      {/* Cover Letter Section */}
      <section className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Cover Letter</h2>
          {application.coverLetterFilename && (
            <a
              className="btn small primary"
              href={`${UPLOADS_BASE}/${application.coverLetterFilename}`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              Download Cover Letter ({application.coverLetterFilename})
            </a>
          )}
        </div>

        {application.coverLetterFilename ? (
          <div style={{ marginTop: 14 }}>
            {isPdf(application.coverLetterFilename) ? (
              <iframe
                title="Candidate Cover Letter Preview"
                src={`${UPLOADS_BASE}/${application.coverLetterFilename}`}
                style={{ width: '100%', height: 500, border: '1px solid #ddd', borderRadius: 8 }}
              />
            ) : (
              <p className="muted">
                In-browser preview is available for PDF files. Download{' '}
                <strong>{application.coverLetterFilename}</strong> using the button above.
              </p>
            )}
          </div>
        ) : application.coverLetter ? (
          <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{application.coverLetter}</div>
        ) : (
          <p className="muted" style={{ marginTop: 10 }}>No cover letter attached to this application.</p>
        )}
      </section>

        </div>
    )
}

export default ApplicationDetails