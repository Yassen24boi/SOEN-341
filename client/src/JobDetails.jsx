import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'
const PROFILEAPI = 'http://localhost:5000/api/profile'

// US-11: shows a salary range
function formatSalary(min, max) {
    const money = (amount) => `$${amount.toLocaleString()}`
    if (min && max) return `${money(min)} - ${money(max)}`
    if (min) return `From ${money(min)}`
    if (max) return `Up to ${money(max)}`
    return 'Not specified'
}

function JobDetails(){
    const {id} = useParams()
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

    useEffect(() => {
        async function loadJobDetails() {
            try{
                const headers = token ? {Authorization: `Bearer ${token}`} : {}
                const res = await fetch(`${API}/${id}`, {headers})
                const data = await res.json()

                if (!res.ok){
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
        if(!token) {
            alert('You must be logged in as a job seeker to apply.')
            navigate('/login')
            return
        }

        try {
            const res = await fetch(PROFILEAPI, {
                headers: {Authorization: `Bearer ${token}`}
            })

            if (!res.ok){
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

    async function handleConfirmApply(e){
        
        e.preventDefault()
        try{
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
                alert(data.message || 'Failed to submit application')
                return
            }
            setApplied(true)
            setShowCvPicker(false)
            alert('Application submitted successfully!')
        } catch(err) {
            console.error(err)
            alert('Could not connect to the server')
        }
    }

    if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Loading job details...</p>
    if (message) return <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}><h2>{message}</h2><button onClick={() => navigate('/jobs')}>Back to jobs</button></div>

    if(!job) return null

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'left' }}>
            <button onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>Back to Job Board</button>

            <h1>{job.title}</h1>
            <h3 style={{ color: '#aaa', marginTop: -10 }}>{job.company} {job.location && `• ${job.location}`}</h3>

            <div style={{ margin: '12px 0' }}>
                <span style={{ background: '#333', padding: '4px 8px', borderRadius: 4 }}>
                    Type: {job.type}
                </span>
            </div>

            
            {/* US-11: category, salary and deadline */}
            <div style={{ display: 'grid', gap: 4, margin: '12px 0' }}>
                <div><strong>Category:</strong> {job.category}</div>
                <div><strong>Salary:</strong> {formatSalary(job.salaryMin, job.salaryMax)}</div>
                <div><strong>Apply before:</strong> {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}</div>
            </div>


            <hr style={{ borderColor: '#444', margin: '20px 0' }}></hr>

                        <h3>Job Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{job.description}</p>

            {/* US-11: requirements */}
            {job.requirements && (
                <>
                    <h3>Requirements</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{job.requirements}</p>
                </>
            )}



            <div style={{ marginTop: 24 }}>
                <button 
                onClick={handleApplyClick} 
                disabled={applied}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: applied ? 'not-allowed' : 'pointer',
                    backgroundColor: applied ? '#555' : '#aaa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px'
                }}
                >
                {applied ? 'Already applied' : 'Apply Now'}
                </button>
            </div>

            {showCvPicker && (
                <div style={{ marginTop: 20, padding: 16, border: '1px solid #555', borderRadius: 6, background: '#1e1e1e' }}>
                    <h3>Select CV for Application</h3>

                    {profileMissingCv ? (
                        <div>
                            <p style={{ color: '#ffb3b3' }}>You do not have a CV uploaded to your profile.</p>
                            <Link to="/profile" style={{ color: '#4dabf7', textDecoration: 'underline' }}>
                                Go to your profile to upload a CV →
                            </Link>
                            <div style={{ marginTop: 12 }}>
                                <button onClick={() => setShowCvPicker(false)} style={{ padding: '6px 12px' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleConfirmApply}>
                            <div style={{ margin: '12px 0' }}>
                                <label style={{ display: 'block', marginBottom: 6 }}>Choose CV:</label>
                                <select 
                                value={selectedResumeFilename} 
                                onChange={(e) => setSelectedResumeFilename(e.target.value)}
                                style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
                                >
                                {userResumes.map((resume) => (
                                    <option key={resume._id} value={resume.filename}>
                                    {resume.label} {resume.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                                </select>
                                <label style={{ display: 'block', marginBottom: 6, marginTop: 6 }}>Cover Letter File (Optional):</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setCoverLetterFile(e.target.files[0])}
                                    style={{ width: '100%', padding: '0px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
                                />
                            </div>



                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Confirm Application
                                </button>
                                <button type="button" onClick={() => setShowCvPicker(false)} style={{ padding: '8px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}

export default JobDetails