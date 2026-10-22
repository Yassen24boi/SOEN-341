import { useState } from "react"
import { Link, useNavigate } from 'react-router-dom'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    return (
       <form onSubmit={async(e) => {
      e.preventDefault()
      try{
        const res = await fetch('http://localhost:5000/api/auth/login',{
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body : JSON.stringify({email, password})
        })
        const data = await res.json()
        if(!res.ok){
          alert(data.message || 'Login Failed')
          return
        }
        localStorage.setItem('token', data.token)
        alert(`Welcome back, ${data.user.fullName}!`)
        navigate('/profile')
      }catch(err){
        console.error(err)
        alert('could not reach the server')
      }
    }}>
       <h1>Sign In</h1>
      <div className="form-row">
      <label htmlFor="email"> Email: </label>
      <input
      id="email"
        type="email"
        value={email}           
        onChange={(e) => setEmail(e.target.value)}
        required
      /></div>

      <div className="form-row">
        <label htmlFor="password"> Password: </label>

        <input
        id ="password"
        type ="password"
        value ={password}
        onChange={(e)=> setPassword(e.target.value)}
        required
        />
        </div>


      <button type="submit">Sign In</button>

      
      <Link to="/create-account">Create Account</Link>
    </form>
    )
}

export default Login