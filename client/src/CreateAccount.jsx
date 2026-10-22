import { useState } from "react"
import { Link, useNavigate } from 'react-router-dom'

function CreateAccount() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('jobseeker')
  const navigate = useNavigate()

  return (
    <form onSubmit={async (e) => {
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
        alert(`Account created! Welcome, ${data.user.fullName}`)
        navigate('/profile')
      } catch (err) {
        console.error(err)
        alert('Could not reach the server')
      }
    }}>
      <h1>Create Account</h1>

      <label htmlFor="fullName">Full Name:</label>
      <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <label htmlFor="role">I am a:</label>
      <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="jobseeker">Job Seeker</option>
        <option value="recruiter">Recruiter</option>
      </select>

      <br />
      <button type="submit">Create Account</button>

      <br />
      <Link to="/login">Already have an account? Log in</Link>
    </form>
  )
}

export default CreateAccount