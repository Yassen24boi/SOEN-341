import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom'

const API = 'http://localhost:5000/api/applications';
const EMPTY_STATS = {
    total: 0,
    pending: 0,
    statuses: {
        Applied: 0,
        'Under Review': 0,
        Interview: 0,
        Offered: 0,
        Rejected: 0,
        Withdrawn: 0
    }
};

function Applications() {
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [filteredStatus, setFilteredStatus] = useState('All');
    const [search, setSearch] = useState('');
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

    useEffect(() => {
        async function fetchStats() {
            if (!token) return;
            try {
                const res = await fetch(`${API}/me/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    setMessage(data.message || 'Failed to load application statistics');
                    return;
                }
                setStats(data);
            } catch (err) {
                console.error(err);
                setMessage('Could not load application statistics');
            }
        }
        fetchStats();
    }, [token]);

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

    function renderTimeline(currentStatus) {
        const steps = ['Applied', 'Under Review', 'Interview', 'Offered'];

        if (currentStatus === 'Rejected' || currentStatus === 'Withdrawn') {
            return (
                <p className="muted" style={{ fontSize: 14 }}>This application is closed.</p>
            );
        }

        const currentIndex = steps.indexOf(currentStatus);

        return (
            <ol className="timeline" aria-label="Application progress">
                {steps.map((step, index) => {
                    const state = index < currentIndex ? 'done' : index === currentIndex ? 'now' : ''
                    return (
                        <li key={step} className={`tl-step ${state}`}>
                            <span className="tl-dot">{index + 1}</span>
                            <span className="tl-label">{step}</span>
                        </li>
                    );
                })}
            </ol>
        );
    }

    const displayedApplications = applications
      .filter(app => {
        const status = app.status || 'Applied';
        if (filteredStatus === 'Pending') return status === 'Applied' || status === 'Under Review';
        return filteredStatus === 'All' || status === filteredStatus;
      })
      .filter(app => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return `${app.job?.title || ''} ${app.job?.company || ''}`.toLowerCase().includes(query);
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

        <section className="application-dashboard" aria-label="Application statistics">
          <div className="application-stat-tiles">
            {[
              { label: 'Total', value: stats.total, filter: 'All' },
              { label: 'Pending', value: stats.pending, filter: 'Pending' },
              { label: 'Interview', value: stats.statuses.Interview, filter: 'Interview' },
              { label: 'Offered', value: stats.statuses.Offered, filter: 'Offered' },
              { label: 'Rejected', value: stats.statuses.Rejected, filter: 'Rejected' }
            ].map((tile) => (
              <button
                type="button"
                key={tile.label}
                className={`card application-stat${filteredStatus === tile.filter ? ' selected' : ''}`}
                aria-pressed={filteredStatus === tile.filter}
                onClick={() => setFilteredStatus(tile.filter)}
              >
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </button>
            ))}
          </div>
          <div className="card application-chart" aria-label="Applications by status">
            <h2>Status breakdown</h2>
            {Object.entries(stats.statuses).map(([status, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div className="application-chart-row" key={status}>
                  <span>{status}</span>
                  <div
                    className="application-chart-track"
                    role="img"
                    aria-label={`${status}: ${count}`}
                  >
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <div className="filter-row">
          <label htmlFor="history-search">Search:</label>
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
            <option value="Pending">Pending ({stats.pending})</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Interview">Interview</option>
            <option value="Offered">Offered</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        {applications.length === 0 ? (
          <div className="card application-empty">
            <h2>No applications yet</h2>
            <p className="muted">Start your job search and your applications will appear here.</p>
            <Link className="btn primary" to="/jobs">Browse jobs</Link>
          </div>
        ) : displayedApplications.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p className="muted">No applications match the selected filter. <Link to="/jobs">Browse jobs →</Link></p>
          </div>
        ) : (
          <div className="app-list">
            {displayedApplications.map((app) => {
              const currentStatus = app.status || 'Applied';
              const canWithdraw = currentStatus !== 'Withdrawn' && currentStatus !== 'Rejected';

              return (
                <div key={app._id} className="card posting">
                  <div className="posting-head">
                    <div>
                      <h3>{app.job ? app.job.title : 'Job No Longer Available'}</h3>
                      <div className="job-co">{app.job ? app.job.company : 'Unknown Company'} {app.job?.location && `• ${app.job.location}`}</div>
                    </div>
                    <span className={`pill ${getStatusClass(currentStatus)}`}>{currentStatus}</span>
                  </div>

                  {renderTimeline(currentStatus)}

                  <div className="app-details">
                    <p><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                    <p><strong>CV Used:</strong> {app.resumeFilename || 'Default CV'}</p>
                    {app.coverLetterFilename && <p><strong>Cover Letter:</strong> Attached</p>}
                  </div>

                  {app.interview && (
                    <div className="notice" style={{ textAlign: 'left' }}>
                      <strong>Interview:</strong> {new Date(app.interview.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      <br />
                      <strong>Where:</strong>{' '}
                      {app.interview.locationOrLink.startsWith('http')
                        ? <a href={app.interview.locationOrLink} target="_blank" rel="noopener noreferrer">{app.interview.locationOrLink}</a>
                        : app.interview.locationOrLink}
                      {app.interview.message && <><br /><strong>Message:</strong> {app.interview.message}</>}
                    </div>
                  )}

                  {canWithdraw && (
                    <div className="posting-actions">
                      <button className="btn small danger" onClick={() => withdrawApplication(app._id)}>
                        Withdraw
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
}

export default Applications;