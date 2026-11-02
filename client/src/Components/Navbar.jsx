import { Link, NavLink, useNavigate } from 'react-router-dom'

function Navbar() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    // Adds the "active" class to the link of the page you are on
    const linkClass = ({ isActive }) => (isActive ? 'active' : undefined)

    // Logged out: login page. Job seekers: their applications. Recruiters: the job list.
    const homePath = !token ? '/login' : role == 'jobseeker' ? '/applications' : '/'

    return (
        <nav className="navbar" aria-label="Main">
            <div className="navbar-inner">
                <Link to={homePath} className="navbar-brand">
                    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                        <rect width="32" height="32" rx="9" fill="var(--accent)" />
                        <circle cx="11.5" cy="16" r="5" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" />
                        <circle cx="20.5" cy="16" r="5" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" />
                    </svg>
                    CareerConnect
                </Link>

                <div className="navbar-links">
                    {token && (
                        <>
                            <NavLink to={homePath} end className={linkClass}>Home</NavLink>
                            <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
                        </>
                    )}
                    {token && role == 'recruiter' && (
                        <NavLink to="/recruiter" className={linkClass}>Dashboard</NavLink>
                    )}
                    {token && role == 'jobseeker' && (
                        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
                    )}
                    <span className="navbar-spacer" />
                    {!token ? (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/create-account" className="btn primary small">Register</Link>
                        </>
                    ) : (
                        <button onClick={handleLogout} className="btn small logout-btn">Logout</button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar