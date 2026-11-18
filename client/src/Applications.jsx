import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom'

const API = 'http://localhost:5000/api/applications';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [filteredStatus, setFilteredStatus] = useState('All');
    const [search, setSearch] = useState('');
    const [sortNewest, setSortNewest] = useState(true);
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
                const res = await fetch(`${API}/me/history`, {
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
          prev.map(app => (app._id === appId
            ? {
                ...app,
                status: 'Withdrawn',
                statusHistory: [...(app.statusHistory || []), { status: 'Withdrawn', date: new Date().toISOString() }]
              }
            : app))
        );
      } catch(err){
        console.error(err)

      }
    }

    // Which colour pill each status gets (see .pill in index.css)
    function getStatusClass(status) {
      switch (status) {
        case 'Interview': return 'good'
        case 'Offered': return 'info'
        case 'Rejected': return 'bad'
        case 'Under Review': return 'warn'
        case 'Withdrawn': return 'plain'
        case 'Applied':
        default: return ''
      }
    }

    function renderTimeline(app) {
        const history = app.statusHistory && app.statusHistory.length
          ? app.statusHistory
          : [{ status: app.status || 'Applied', date: app.createdAt }];

        return (
            <ol className="history-timeline" aria-label="Application timeline">
                {history.map((entry) => (
                    <li key={`${entry.status}-${entry.date}`}>
                        <span className="history-dot" />
                        <span>
                            <strong>{entry.status}</strong>
                            <small>{new Date(entry.date).toLocaleDateString()}</small>
                        </span>
                    </li>
                ))}
            </ol>
        );
    }

    const displayedApplications = applications
      .filter(app => filteredStatus === 'All' || (app.status || 'Applied') === filteredStatus)
      .filter(app => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return `${app.job?.title || ''} ${app.job?.company || ''}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const difference = new Date(a.createdAt) - new Date(b.createdAt);
        return sortNewest ? -difference : difference;
      });

    if (loading) return <div className="page"><p className="muted">Loading your applications...</p></div>;
    if (message) return <div className="page narrow"><h2>{message}</h2></div>;

    return (
      <div className="page narrow">
        <div style={{ marginBottom: 20 }}>
          <button className="btn small" onClick={() => navigate('/jobs')}>← Back to Job Board</button>
        </div>
        <span className="eyebrow">Track your progress</span>
        <h1>My Job Applications</h1>

        <div className="history-controls">
          <label htmlFor="history-search">Search</label>
          <input
            id="history-search"
            type="search"
            placeholder="Search job title or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filteredStatus}
            onChange={(e) => setFilteredStatus(e.target.value)}
          >
            <option value="All">All Statuses ({applications.length})</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Interview">Interview</option>
            <option value="Offered">Offered</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          <button type="button" className="btn small" onClick={() => setSortNewest((value) => !value)}>
            Date: {sortNewest ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        {displayedApplications.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p className="muted">No applications match the selected filter. <Link to="/jobs">Browse jobs →</Link></p>
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Applied</th>
                  <th>Current status</th>
                  <th>Timeline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedApplications.map((app) => {
                  const currentStatus = app.status || 'Applied';
                  const canWithdraw = currentStatus !== 'Withdrawn' && currentStatus !== 'Rejected';
                  return (
                    <tr key={app._id}>
                      <td>
                        <strong>{app.job ? app.job.title : 'Job No Longer Available'}</strong>
                        <div className="job-co">{app.job ? app.job.company : 'Unknown Company'} {app.job?.location && `• ${app.job.location}`}</div>
                      </td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td><span className={`pill ${getStatusClass(currentStatus)}`}>{currentStatus}</span></td>
                      <td>{renderTimeline(app)}</td>
                      <td>
                        {canWithdraw && (
                          <button className="btn small danger" onClick={() => withdrawApplication(app._id)}>Withdraw</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
}

export default Applications;