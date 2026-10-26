import { Link, useNavigate } from 'react-router-dom'

function Navbar() {

    const navigate = useNavigate()
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    return (
        <nav className = "navbar">
            <div className="navbar-brand">CareerConnect</div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                {token && role == 'recruiter' && (
                    <Link to='/recruiter'>Dashboard</Link>
                )}

                {token && role == 'jobseeker' && (
                    <Link to="/profile">Profile</Link>
                )}
                
                {!token ? (
                    <>
                        <Link to='/login'>Login</Link>
                        <Link to='create-account'>Register</Link>
                    </>
                ) : (
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                )}
            </div>
        </nav>
    )
}

export default Navbar