import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom'

const API = 'http://localhost:5000/api/applications';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [filteredStatus, setFilteredStatus] = useState('All');
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

    async function withdrawApplication(appId) {
      if(!window.confirm('Are you sure you want to withdraw this application?')) return;
      try{
        const res = await fetch(`${API}/${appId}/withdraw`, {
          method: 'PATCH',
          headers: {Authorization: `Bearer ${token}`}
        });
        const data = await res.json();
        if(!res.ok){
          alert(data.message || 'Failed to withdraw application');
          return;
        }

        setApplications(prev =>
          prev.map(app => (app._id === appId ? {...app, status: 'Withdrawn'} : app))
        );
      } catch(err){
        console.error(err)

      }
    }

    function getStatusStyle(status) {
      switch (status) {
        case 'Interview':
          return {color: '#81c784'};
        case 'Offered':
          return {color: '#a78bfa'};
        case 'Rejected':
          return {color: '#e57373'};
        case 'Under Review':
          return {color: '#4dabf7'};
        case 'Withdrawn':
          return {color: '#9ca3af'}
        case 'Applied':
        default:
          return {color: '#ffd54f'}
      }
    }

    const displayedApplications = filteredStatus === 'All'
      ? applications
      : applications.filter(app => (app.status || 'Applied') === filteredStatus);

    if (loading) return <p style={{ textAlign: 'center', padding: 20 }}>Loading your applications...</p>;
    if (message) return <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}><h2>{message}</h2></div>;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, textAlign: 'left' }}>
      <button onClick={() => navigate('/jobs')} style={{ marginBottom: 16 }}>Back to Job Board</button>
      <h1>My Job Applications</h1>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <label htmlFor="status-filter"><strong>Filter by Status:</strong></label>
                <select
                    id="status-filter"
                    value={filteredStatus}
                    onChange={(e) => setFilteredStatus(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 4, background: '#2a2a2a', color: '#fff', border: '1px solid #555' }}
                >
                    <option value="All">All Statuses ({applications.length})</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Interview">Interview</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                </select>
            </div>

      {displayedApplications.length === 0 ? (
        <p>No applications match the selected filter. <Link to="/jobs" style={{ color: '#4dabf7' }}>Browse jobs →</Link></p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayedApplications.map((app) => {
            
            const currentStatus = app.status || 'Applied';
            const statusStyle = getStatusStyle(currentStatus);
            const canWithdraw = currentStatus !== 'Withdrawn' && currentStatus !== 'Rejected'; 

            return (
            <div key={app._id} style={{ padding: 16, border: '1px solid #555', borderRadius: 6, background: '#1e1e1e' }}>
              <h3>{app.job ? app.job.title : 'Job No Longer Available'}</h3>
              <h4 style={{ color: '#aaa', marginTop: -8 }}>{app.job ? app.job.company : 'Unknown Company'} {app.job?.location && `• ${app.job.location}`}</h4>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '14px' }}>
                <p><strong>Status:</strong> <span style={{ color: statusStyle.color, background: '#333', padding: '2px 6px', borderRadius: 4 }}>{currentStatus}</span></p>
                <p><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              {canWithdraw && (
                <button
                  onClick={() => withdrawApplication(app._id)}
                  style={{background: '#3a1f1f', color: '#e57373', border: '1px solid #e57373', padding: '4px 10px', borderRadius: 4, cursor: 'pointer'}}
                >
                  Withdraw
                </button>
              )}
              <p style={{ marginTop: 8, fontSize: '14px', color: '#ccc' }}><strong>CV Used:</strong> {app.resumeFilename || 'Default CV'}</p>
              {app.coverLetterFilename && <p style={{ fontSize: '14px', color: '#ccc' }}><strong>Cover Letter:</strong> Attached</p>}
            </div>
            );
          })}
        </div>
      )}
    </div>
    );
}

export default Applications;