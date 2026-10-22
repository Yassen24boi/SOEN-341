import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(null)
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        
        if (res.status === 404) {
            setProfile(null)
        } else if (!res.ok) {
          alert(data.message || 'Could not load profile')
          return
        } else {
            // AT-06.3 Fix: The backend always sends fullName/email. 
            // If 'user_id' is missing, it means the extended profile hasn't been created yet.
            if (!data || !data.user_id) {
                setProfile(null)
            } else {
                setProfile(data)
            }
        }
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

  const handlePreviewResume = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile/resume', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Could not fetch resume for preview');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
      alert('Could not reach the server');
    }
  };

  if (!token) {
    return <p>You must be logged in to view this page.</p>
  }

  if (loading) {
    return <p>Loading profile...</p>
  }

  // AT-06.3: Empty state when no profile exists
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>You don't have a profile yet!</h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          Recruiters can't see you. Create a profile to stand out and manage your CVs.
        </p>
        <button 
          onClick={() => {
            localStorage.removeItem('token'); // Clear token so they can log in properly
            navigate('/login'); 
          }} 
          style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Create Profile/Login
        </button>
      </div>
    );
  }

  // AT-06.1: Full Profile View with metadata
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
          <label><strong>My CVs:</strong></label>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 5px 0' }}><strong>File Name:</strong> {profile.resumeFileName}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  <strong>Upload Date:</strong> {profile.resumeUpdatedAt ? new Date(profile.resumeUpdatedAt).toLocaleDateString() : 'Recently uploaded'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" onClick={handleDownloadResume}>Download</button>
                  <button onClick={handlePreviewResume} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Preview
                </button>
              </div>
            </div>

            {/* AT-06.2: PDF Preview Window */}
            {previewUrl && (
              <div style={{ marginTop: '20px', borderTop: '2px dashed #ccc', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Resume Preview</h4>
                  <button onClick={() => setPreviewUrl(null)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Close Preview</button>
                </div>
                <iframe 
                  src={previewUrl} 
                  width="100%" 
                  height="600px" 
                  title="Resume PDF Preview" 
                  style={{ border: '1px solid #ccc', borderRadius: '4px' }} 
                />
              </div>
            )}
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