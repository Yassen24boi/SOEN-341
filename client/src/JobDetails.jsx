import {useEffect, useState} from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'

function JobDetails(){
    const {id} = useParams()
    const navigate = useNavigate()
    const token = localStorage.getItem('token')

    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [applied, setApplied] = useState(false)

    useEffect(() => {
        async function loadJobDetails() {
            try{
                const headers = token ? {Authorization: `Bearer ${token}`} : {}
                const res = await fetch(`${API}/${id}`)
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
    }, [id])

    async function handleApply(){
        if(!token) {
            alert('You must be logged in as a job seeker to apply.')
            navigate('/login')
            return
        }

        try{
            const res = await fetch(`${API}/${id}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (!res.ok) {
                alert(data.message || 'Failed to submit application')
                return
            }
            setApplied(true)
            alert('Application submitted successfully!')
        } catch(err) {
            console.error(err)
            alert('Could not connect to the server')
        }
    }

    if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Loading job details...</p>
    if (message) return <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}><h2>{message}</h2><button onClick={() => navigate('/jobs')}>Back to jobs</button></div>

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

            <hr style={{ borderColor: '#444', margin: '20px 0' }}></hr>

            <h3>Job Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{job.description}</p>

            <div style={{ marginTop: 24 }}>
                <button 
                onClick={handleApply} 
                disabled={applied}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: applied ? 'not-allowed' : 'pointer',
                    backgroundColor: applied ? '#555' : '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px'
                }}
                >
                {applied ? 'Applied' : 'Apply Now'}
                </button>
            </div>
        </div>
    )
}

export default JobDetails