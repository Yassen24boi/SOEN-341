import { useState, useEffect } from "react"
import {useNavigate} from 'react-router-dom'

function Profile(){
const [fullName, setFullName] = useState('')
const [email, setEmail] = useState('')
const [headline, setHeadline] = useState('')
const [resumeFile, setResumeFile] = useState(null)
const [resumeFileName, setResumeFileName] = useState(null)
const [loading, setLoading] = useState(true)

const token = localStorage.getItem('token')

useEffect(() => {
  async function loadProfile() {
    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Could not load profile')
        return
      }
      setFullName(data.fullName || '')
      setEmail(data.email || '')
      setHeadline(data.headline || '')
      setResumeFileName(data.resumeFileName || null)
    } catch (err) {
      console.error(err)
      alert('Could not reach the server')
    } finally {
      setLoading(false)
    }
  }
  if (token) {
    loadProfile()
  } else {
    setLoading(false)
  }
}, [token])

async function handleSaveProfile(e) {
  e.preventDefault()
  try {
    const res = await fetch('http://localhost:5000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, email, headline })
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.message || 'Could not save profile')
      return
    }
    alert('Profile saved!')
  } catch (err) {
    console.error(err)
    alert('Could not reach the server')
  }
}

async function handleResumeUpload() {
  if (!resumeFile) {
    alert('Choose a file first')
    return
  }
  const formData = new FormData()
  formData.append('resumeFile', resumeFile)
  try {
    const res = await fetch('http://localhost:5000/api/profile/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.message || 'Upload failed')
      return
    }
    setResumeFileName(data.resumeFileName)
    alert('Resume uploaded!')
  } catch (err) {
    console.error(err)
    alert('Could not reach the server')
  }
}
const navigate = useNavigate()
function handleLogout() {
  localStorage.removeItem('token')
  navigate('/login')
}

if (!token) {
  return <p>You must be logged in to view this page.</p>
}

if (loading) {
  return <p>Loading profile...</p>
}

return (
  <form onSubmit={handleSaveProfile}>

<h1> Create Account / My Profile </h1>

<button type = "button" onClick={handleLogout}>Log out</button>

<label htmlFor="fulleName"> Full Name: </label>
      <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

<label htmlFor="email"> Email: </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

 <label htmlFor="headline"> Headline: </label>
      <input
        id="headline"
        type="text"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        required
      />   

<label htmlFor="resume"> Resume: </label>
      <input
        id="resumeFile"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setResumeFile(e.target.files[0])}
      />

     {resumeFileName && <p>Current resume: {resumeFileName}</p>}
{resumeFile && <p>Selected file: {resumeFile.name}</p>}
<br />
<button type="submit">Save Profile</button>
<button type="button" onClick={handleResumeUpload}>Upload Resume</button>

</form>
)

}

export default Profile