import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Profile from './Profile'
import CreateAccount from './CreateAccount'
import Register from './Register'
import EditProfile from './EditProfile'
import './App.css'
import RecruiterDashboard from './RecruiterDashboard'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/create-account" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile/>}/>
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App