import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom'

const API = 'http://localhost:5000/api/applications';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        async function fetchApplications() {
            if(!token){
                navigate('/login');
                return;
            }
            try{
                const res = await fetch(API, {
                    headers: {Authorization: `Bearer ${token}`}
                });
                const data = await res.json();
                if(!res.ok){
                    setMessage(data.Message || 'Failed to load applications');
                    return;
                }
                setApplications(data);

            } catch (err) {
                console.error(err);
                setMessage('Could not connect to the server');
            } finally {
                setLoading(false)
            }
          }  
        fetchApplications();
    }, [token, navigate]);

    if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Loading your applications...</p>;
    if (message) return <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}><h2>{message}</h2></div>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'left' }}>
      <button onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>Back to Job Board</button>
      <h1>My Job Applications</h1>

      {applications.length === 0 ? (
        <p>You haven't applied to any jobs yet. <Link to="/jobs" style={{ color: '#4dabf7' }}>Browse jobs →</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {applications.map((app) => (
            <div key={app._id} style={{ padding: 16, border: '1px solid #555', borderRadius: 6, background: '#1e1e1e' }}>
              <h3>{app.job ? app.job.title : 'Job No Longer Available'}</h3>
              <h4 style={{ color: '#aaa', marginTop: -8 }}>{app.job ? app.job.company : 'Unknown Company'} {app.job?.location && `• ${app.job.location}`}</h4>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '14px' }}>
                <p><strong>Status:</strong> <span style={{ color: '#4dabf7', background: '#333', padding: '2px 6px', borderRadius: 4 }}>{app.status || 'Applied'}</span></p>
                <p><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <p style={{ marginTop: 8, fontSize: '14px', color: '#ccc' }}><strong>CV Used:</strong> {app.resumeFilename || 'Default CV'}</p>
              {app.coverLetterFilename && <p style={{ fontSize: '14px', color: '#ccc' }}><strong>Cover Letter:</strong> Attached</p>}
            </div>
          ))}
        </div>
      )}
    </div>
    );
}

export default Applications;