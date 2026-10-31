import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'
const PROFILEAPI = 'http://localhost:5000/api/profile'

// US-11: shows a salary range, per year or per hour
function formatSalary(min, max, period) {
    const money = (amount) => `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    const unit = period === 'hourly' ? '/hour' : '/year'
    if (min && max) return `${money(min)} - ${money(max)}${unit}`
    if (min) return `From ${money(min)}${unit}`
    if (max) return `Up to ${money(max)}${unit}`
    return 'Not specified'
}

function JobDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const token = localStorage.getItem('token')

    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [applied, setApplied] = useState(false)

    const [showCvPicker, setShowCvPicker] = useState(false)
    const [userResumes, setUserResumes] = useState([])
    const [selectedResumeFilename, setSelectedResumeFilename] = useState('')
    const [profileMissingCv, setProfileMissingCv] = useState(false)
    const [coverLetterFile, setCoverLetterFile] = useState(null)

    const [submissionResult, setSubmissionResult] = useState(null)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        async function loadJobDetails() {
            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/${id}`, { headers })
                const data = await res.json()

                if (!res.ok) {
                    setMessage(data.message || 'Job posting not found')
                    return
                }

                setJob(data)
                setApplied(data.alreadyApplied)
            } catch (err) {
                console.error(err)
                setMessage('Could not connect top the server')
            } finally {
                setLoading(false)
            }
        }
        loadJobDetails()
    }, [id, token])

    async function handleApplyClick() {
        if (!token) {
            alert('You must be logged in as a job seeker to apply.')
            navigate('/login')
            return
        }

        try {
            const res = await fetch(PROFILEAPI, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                setProfileMissingCv(true)
                setShowCvPicker(true)
                return
            }

            const profileData = await res.json()
            const resumes = profileData.resumes || []

            if (resumes.length === 0) {
                setProfileMissingCv(true)
            } else {
                setUserResumes(resumes)
                const defaultCV = resumes.find(r => r.isDefault) || resumes[0]
                setSelectedResumeFilename(defaultCV.filename)
                setProfileMissingCv(false)
            }

            setShowCvPicker(true)

        } catch (err) {
            console.error(err)
            alert('Could not verify profile details.')
        }
    }

    async function handleConfirmApply(e) {

        e.preventDefault()
        try {
            const formData = new FormData()
            formData.append('resumeFilename', selectedResumeFilename)

            if (coverLetterFile) {
                formData.append('coverLetterFile', coverLetterFile)
            }

            const res = await fetch(`${API}/${id}/apply`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            })
            const data = await res.json()
            if (!res.ok) {
                setFormError(data.message || 'Failed to submit application')
                return
            }
            setApplied(true)
            setShowCvPicker(false)
            setSubmissionResult(data)
        } catch (err) {
            console.error(err)
            alert('Could not connect to the server')
        }
    }

    if (loading) return <div className="page"><p className="muted">Loading job details...</p></div>
    if (message) return <div className="page narrow"><h2>{message}</h2><button onClick={() => navigate('/jobs')}>Back to jobs</button></div>

    if (!job) return null

    return (
        <div className="page narrow">
            <div style={{ marginBottom: 20 }}>
                <button className="btn small" onClick={() => navigate('/jobs')}>← Back to job board</button>
            </div>

            <span className="pill good">{job.type}</span>
            <h1 style={{ marginTop: 10 }}>{job.title}</h1>
            <p className="muted" style={{ fontSize: 18 }}>{job.company} {job.location && `· ${job.location}`}</p>

            {/* US-11: category, salary and deadline */}
            <div className="facts">
                <div><small>Category</small><b>{job.category || 'Not specified'}</b></div>
                <div><small>Salary</small><b>{formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}</b></div>
                <div><small>Apply before</small><b>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}</b></div>
            </div>

            <h3>Job description</h3>
            <p className="prose">{job.description}</p>

            {/* US-11: requirements */}
            {job.requirements && (
                <>
                    <h3>Requirements</h3>
                    <p className="prose">{job.requirements}</p>
                </>
            )}

            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button
                    className="btn primary"
                    onClick={handleApplyClick}
                    disabled={applied}
                >
                    {applied ? '✓ Already applied' : 'Apply now'}
                </button>
                {applied && !submissionResult && (
                    <Link to="/applications">Check your application status →</Link>
                )}
            </div>

            {submissionResult && (
                <div className="card panel success-card">
                    <h3 style={{ marginTop: 0 }}>Application submitted</h3>
                    <p><strong>Job Title:</strong> {submissionResult.jobTitle}</p>
                    <p><strong>Date:</strong> {new Date(submissionResult.createdAt).toLocaleDateString()}</p>
                    <p style={{ marginTop: 12 }}>
                        <Link to="/applications">View My Applications →</Link>
                    </p>
                </div>
            )}

            {showCvPicker && (
                <div className="card panel">
                    <h3 style={{ marginTop: 0 }}>Select CV for Application</h3>

                    {formError && (
                        <div className="alert-error" role="alert">{formError}</div>
                    )}

                    {profileMissingCv ? (
                        <div>
                            <p className="error">You do not have a CV uploaded to your profile.</p>
                            <p style={{ marginTop: 8 }}>
                                <Link to="/profile">Go to your profile to upload a CV →</Link>
                            </p>
                            <div style={{ marginTop: 12 }}>
                                <button className="btn small" onClick={() => setShowCvPicker(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleConfirmApply} style={{ display: 'grid', gap: 12 }}>
                            <div className="field">
                                <label htmlFor="cv-select">Choose CV</label>
                                <select
                                    id="cv-select"
                                    value={selectedResumeFilename}
                                    onChange={(e) => setSelectedResumeFilename(e.target.value)}
                                >
                                    {userResumes.map((resume) => (
                                        <option key={resume._id} value={resume.filename}>
                                            {resume.label} {resume.isDefault ? '(Default)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="cover-letter">Cover letter file (optional)</label>
                                <input
                                    id="cover-letter"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setCoverLetterFile(e.target.files[0])}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn primary">Confirm application</button>
                                <button type="button" className="btn" onClick={() => setShowCvPicker(false)}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}

export default JobDetails