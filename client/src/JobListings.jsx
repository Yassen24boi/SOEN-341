import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'

function JobListings(){
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')

    useEffect(() => {
        async function loadOpenJobs() {
            try {
                const res = await fetch(`${API}`)
                const data = await res.json()
                if (!res.ok){
                    setMessage(data.message || 'Could not load job listings')
                    return
                }
                setJobs(data.jobs || [])
            } catch (err) {
                console.error(err)
                setMessage('Could not connect to the server')
            } finally {
                setLoading(false)
            }
        }
        loadOpenJobs()
    }, [])


    if (loading) return <p style={{textAlign: 'center', padding: 20}}>Loading job listings...</p>

    return (
        <div style={{maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'left'}}>
            <h1>Available Job Openings</h1>
            {message && <p style={{color: 'red'}}>{message}</p>}

            {jobs.length == 0 ? (
                <p>No job postings are currently available.</p>
            ) : (
                jobs.map((job) => (
                    <div key={job._id} style={{border: '1px solid #888', borderRadius: 6, padding: 16, marginBottom: 12}}>
                        <h2>{job.title}</h2>
                        <p style = {{margin: '4px 0', color : '#aaa'}}>
                            <strong>{job.company}</strong> {job.location && `• ${job.location}`}
                        </p>
                        <div style={{margin: '8px 0', fontSize: '13px'}}>
                            <span style = {{background: '#333', padding: '2px 6px', borderRadius: 4, marginRight: 8}}>
                                {job.type}
                            </span>
                        </div>
                        
                        <button
                            onClick={() => navigate(`/jobs/${job._id}`)}
                            style={{ marginTop: 8, padding: '6px 14px', cursor: 'pointer'}}
                        >
                            View Details
                        </button>
                    </div>
                ))
            )}
        </div>
    )
}

export default JobListings