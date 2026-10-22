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
    <div className="display-profile" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1>My Profile</h1>

      <div className="form-row">
        <label><strong>Full Name:</strong></label>
        <p>{profile?.fullName || 'Not provided'}</p>
      </div>

      <div className="form-row">
        <label><strong>Email:</strong></label>
        <p>{profile?.email || 'Not provided'}</p>
      </div>

      <div className="form-row">
        <label><strong>Headline:</strong></label>
        <div className="view-box-style">
        <p>{profile?.headline || 'Not provided'}</p>
        </div>
      </div>

      <div className="form-row">
        <label><strong>Resume:</strong></label>
        {profile?.resumeFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height:'40px' }}>
            <button type="button" style={{height:'100%'}} onClick={handleDownloadResume}>Download</button>
          </div>
        ) : (
          <p>No resume uploaded</p>
        )}
      </div>

      <button type="button" onClick={() => navigate('/profile/edit')}>
        Edit Profile
      </button>
    </div>
  )
}

export default Profile