import { useState, useEffect } from "react"

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
    const profileRes = await fetch('http://localhost:5000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, email, headline })
    })
    const profileData = await profileRes.json()
    if (!profileRes.ok) {
      alert(profileData.message || 'Could not save profile')
      return
    }

    if(resumeFile){
      const formData = new FormData()
      formData.append('resumeFile', resumeFile)

      const resumeRes = await fetch('http://localhost:5000/api/profile/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
      })
      const resumeData = await resumeRes.json()
      if (!resumeRes.ok) {
        alert(resumeData.message || 'Profile saved, but resume upload failed')
        return
      }
      setResumeFileName(resumeData.resumeFileName)
      setResumeFile(null)
    }

    alert('Profile saved!')
  } catch (err) {
    console.error(err)
    alert('Could not reach the server')
  }
}

  async function handleDownloadResume() {
    try {
      const res = await fetch('http://localhost:5000/api/profile/resume', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        alert('Could not download resume')
        return
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Could not reach the server')
    }
  }

if (!token) {
  return <p>You must be logged in to view this page.</p>
}

if (loading) {
  return <p>Loading profile...</p>
}

return (
  <form onSubmit={handleSaveProfile}>

<h1> My Profile </h1>

<div className="form-row">
  <label htmlFor="fullName"> Full Name: </label>
  <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
    />
</div>

<div className="form-row">
  <label htmlFor="email"> Email: </label>
  <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
  />
</div>

<div className="form-row">
  <label htmlFor="headline"> Headline: </label>
    <input
        id="headline"
        type="text"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        required
    />
</div>

<div className="form-row">
<label htmlFor="resume"> Resume: </label>
      <input
        id="resumeFile"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setResumeFile(e.target.files[0])}
      />
</div>
     {resumeFileName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p>Current resume uploaded:</p>
          <button type="button" onClick={handleDownloadResume}>Download Resume</button>
        </div>
      )}
{resumeFile && <p>Selected file: {resumeFile.name}</p>}

<button type="submit">Save Profile</button>

</form>
)

}

export default Profile