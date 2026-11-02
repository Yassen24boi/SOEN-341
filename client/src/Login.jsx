import { useState } from "react"
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  return (
    <div className="auth-wrap">
      <form className="card auth-form" onSubmit={async (e) => {
        e.preventDefault()
        try {
          const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          const data = await res.json()
          if (!res.ok) {
            alert(data.message || 'Login Failed')
            return
          }
          localStorage.setItem('token', data.token)
          localStorage.setItem('role', data.user.role)

          // Task 4.4: Redirect based on profile status and role
          if (data.user.role === 'jobseeker' && !data.user.hasProfile) {
            alert(`Welcome, ${data.user.fullName}! Please set up your professional profile.`)
            navigate('/profile/edit')
          } else if (data.user.role === 'recruiter') {
            navigate('/recruiter')
          } else {
            alert(`Welcome back, ${data.user.fullName}!`)
            navigate('/profile')
          }
        } catch (err) {
          console.error(err)
          alert('could not reach the server')
        }
      }}>
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in</h1>
        </div>
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
          />
        </div>

        <button type="submit" className="btn primary block">Sign in</button>
        <p className="auth-foot">New here? <Link to="/create-account">Create an account</Link></p>
      </form>
    </div>
  )
}

export default Login