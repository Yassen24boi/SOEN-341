import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

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
        setProfile(data)
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

  // Helper function to safely display dates without timezone shifts messing up months/days
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    <div className="display-profile" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1>My Profile</h1>

      {profile?.fullName && (
        <div className="form-row">
          <label><strong>Full Name:</strong></label>
          <p>{profile.fullName}</p>
        </div>
      )}

      {profile?.email && (
        <div className="form-row">
          <label><strong>Email:</strong></label>
          <p>{profile.email}</p>
        </div>
      )}

      {profile?.headline && (
        <div className="form-row">
          <label><strong>Headline:</strong></label>
          <div className="view-box-style">
            <p>{profile.headline}</p>
          </div>
        </div>
      )}

      {profile?.location && (
        <div className="form-row">
          <label><strong>Location:</strong></label>
          <div className="view-box-style">
            <p>{profile.location}</p>
          </div>
        </div>
      )}

      {profile?.phone && (
        <div className="form-row">
          <label><strong>Phone:</strong></label>
          <p>{profile.phone}</p>
        </div>
      )}

      {profile?.summary && (
        <div className="form-row">
          <label><strong>Summary:</strong></label>
          <div className="view-box-style">
            <p>{profile.summary}</p>
          </div>
        </div>
      )}

      {profile?.skills && profile.skills.length > 0 && (
        <div className="form-row">
          <label><strong>Skills:</strong></label>
          <div className="view-box-style">
            <p>{profile.skills.join(', ')}</p>
          </div>
        </div>
      )}

      {profile?.experience && profile.experience.length > 0 && (
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'left' }}>
          <h3>Experience</h3>
          {profile.experience.map((exp, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <p><strong>{exp.title}</strong> at {exp.company}</p>
              <p style={{ fontSize: '14px', color: '#555' }}>
                {exp.location && `${exp.location} | `} 
                {formatDate(exp.from)} — {exp.current ? 'Present' : formatDate(exp.to)}
              </p>
            </div>
          ))}
        </div>
      )}

      {profile?.education && profile.education.length > 0 && (
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'left' }}>
          <h3>Education</h3>
          {profile.education.map((edu, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <p><strong>{edu.school}</strong></p>
              <p style={{ fontSize: '14px', color: '#555' }}>{edu.degree} in {edu.fieldOfStudy}</p>
            </div>
          ))}
        </div>
      )}

      {profile?.links && (profile.links.portfolio || profile.links.linkedin || profile.links.github) && (
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'left' }}>
          <h3>Links</h3>
          {profile.links.portfolio && <p><a href={profile.links.portfolio} target="_blank" rel="noreferrer">Portfolio</a></p>}
          {profile.links.linkedin && <p><a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></p>}
          {profile.links.github && <p><a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a></p>}
        </div>
      )}

      {profile?.resumeFileName && (
        <div className="form-row" style={{ borderTop: '1px solid #ccc', paddingTop: '15px' }}>
          <label><strong>Resume:</strong></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height:'40px' }}>
            <button type="button" style={{height:'100%'}} onClick={handleDownloadResume}>Download</button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => navigate('/profile/edit')} style={{ marginTop: '20px' }}>
        Edit Profile
      </button>
    </div>
  )
}

export default Profile