import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Register(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const navigate = useNavigate();

    async function handleRegister(e){
        e.preventDefault()
        try{
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });
            const data = await res.json();

            if(!res.ok) {
                alert(data.message || 'Registration failed');
                return;
            }

            //Save the token returned from registration
            localStorage.setItem('token', data.token);
            alert('Account created succesfully!');

            navigate('/profile');
        }
        catch (err) {
            console.error(err);
            alert('Could not reach the server');
        }
    }

    return(
        <form onSubmit={handleRegister}>
      <h1>Create Account</h1>
      
    <div className="form-row">
      <label htmlFor="fullName">Full Name:</label>
      <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
    </div>
    <div className="form-row">
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
    <div className="form-row">
      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

      <button type="submit">Sign Up</button>
    </form>
    );
}

export default Register;