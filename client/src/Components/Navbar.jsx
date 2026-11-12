import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
function Navbar() {
    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const [unreadCount, setUnreadCount] = useState(0)

useEffect(() => {
    if (!token) return

    let active = true

    async function refreshCount() {
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) return

            const data = await res.json()
            if (active) setUnreadCount(data.unreadCount)
        } catch {
            // Retry on the next refresh.
        }
    }

    refreshCount()
    const timer = setInterval(refreshCount, 15000)
    window.addEventListener('notifications-updated', refreshCount)

    return () => {
        active = false
        clearInterval(timer)
        window.removeEventListener('notifications-updated', refreshCount)
    }
}, [token])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    // Adds the "active" class to the link of the page you are on
    const linkClass = ({ isActive }) => (isActive ? 'active' : undefined)

    // Logged out: login page. Job seekers: their applications. Recruiters: the job list.
    const homePath = !token ? '/login' : role == 'jobseeker' ? '/applications' : role == 'recruiter' ? '/recruiter' : '/'
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
                           <NavLink to="/notifications" className={linkClass}>Notifications
                            {unreadCount > 0 && (
                             <span className="notification-badge">{unreadCount}</span>
                             )}
                            </NavLink> </>
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
