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

function App() {
  return (
    <BrowserRouter>
      <Navbar/>
    
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile/>}/>
        <Route path="/jobs" element={<JobList/>}/>
        <Route path="/jobs/:id" element={<JobDetails/>}/>
        <Route path="/applications" element={<Applications/>}/>
        <Route path="/" element={<JobList/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App