import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Profile from './Profile'
import CreateAccount from './CreateAccount'
import EditProfile from './EditProfile'
import JobList from './JobList'
import JobDetails from './JobDetails'
import Applications from './Applications'
import './App.css'
import RecruiterDashboard from './RecruiterDashboard'
import Navbar from "./Components/Navbar"
import './Components/Navbar.css'
import RequireAuth from './Components/RequireAuth'

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/recruiter" element={<RequireAuth><RecruiterDashboard /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/profile/edit" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
        <Route path="/jobs" element={<RequireAuth><JobList /></RequireAuth>} />
        <Route path="/jobs/:id" element={<RequireAuth><JobDetails /></RequireAuth>} />
        <Route path="/" element={<RequireAuth><JobList /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App