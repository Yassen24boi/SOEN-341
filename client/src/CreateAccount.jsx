import { useState } from "react"
import { Link, useNavigate } from 'react-router-dom'

function CreateAccount() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('jobseeker')
  const navigate = useNavigate()

  return (
    <div className="auth-wrap">
    <form className="card auth-form" onSubmit={async (e) => {
      e.preventDefault()
      try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, role })
        })
        const data = await res.json()

        if (!res.ok) {
          alert(data.message || 'Could not create account')
          return
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.user.role)
        alert(`Account created! Welcome, ${data.user.fullName}`)

        // Redirect new job seekers straight to profile setup, and recruiters to their dashboard
        if (data.user.role === 'jobseeker') {
          navigate('/profile/edit')
        } else if (data.user.role === 'recruiter') {
          navigate('/recruiter')
        } else {
          navigate('/profile')
        }
      } catch (err) {
        console.error(err)
        alert('Could not reach the server')
      }
    }}>
      <div>
        <span className="eyebrow">Join CareerConnect</span>
        <h1>Create account</h1>
      </div>

      <div className="field">
      <label htmlFor="fullName">Full Name:</label>
      <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      /></div>

      <div className="field">
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /></div>

      <div className="field">
      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /></div>

      <div className="field">
      <label htmlFor="role">I am a:</label>
      <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="jobseeker">Job Seeker</option>
        <option value="recruiter">Recruiter</option>
      </select></div>

      <button type="submit" className="btn primary block">Create account</button>
      <p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
    </div>
  )
}

export default CreateAccount