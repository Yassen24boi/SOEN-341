import { useState } from "react"
import { Link } from 'react-router-dom'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    return (
       <form onSubmit={(e) => {
      e.preventDefault()
      alert('Login functionality needs the backend — not built yet!')
    }}>
       <h1>Sign In</h1>

      <label htmlFor="email"> Email: </label>
      <input
      id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />


        <label htmlFor="password"> Password: </label>

        <input
        id ="password"
        type ="password"
        value ={password}
        onChange={(e)=> setPassword(e.target.value)}
        required
        />

    <br />
      <button type="submit">Sign In</button>

      <br />
      <Link to="/create-account">Create Account</Link>
    </form>
    )
}

export default Login