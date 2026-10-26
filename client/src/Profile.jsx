import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const token = localStorage.getItem('token')
  const [loading, setLoading] = useState(!!token)
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

async function handleDownloadResume(filename, label) {
    try {
      // Updated URL to target the specific file
      const res = await fetch(`http://localhost:5000/api/profile/resume/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        alert('Could not download resume');
        return;
      }

      // Extract the correct filename and extension sent by the backend
      let downloadName = 'resume.pdf';
      const disposition = res.headers.get('content-disposition');
      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          downloadName = filenameMatch[1];
        }
      } else if (profile?.fullName && label) {
        // Fallback styling: fullname_label.ext
        const sanitizedName = profile.fullName.replace(/\s+/g, '_');
        const sanitizedLabel = label.replace(/\s+/g, '_');
        const ext = filename.substring(filename.lastIndexOf('.'));
        downloadName = `${sanitizedName}_${sanitizedLabel}_resume${ext}`;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName; // Respects .docx, .doc, or .pdf
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not reach the server');
    }
  }

  const handlePreviewResume = async (filename) => {
    try {
      // Updated URL to target the specific file
      const res = await fetch(`http://localhost:5000/api/profile/resume/${filename}`, {
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

  const handleSetDefault = async (cvId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile/resume/${cvId}/default`, { 
        method: 'PATCH', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        window.location.reload(); // Quick way to refresh the data
      } else {
        alert('Failed to set as default');
      }
    } catch (err) {
      console.error('Failed to set default', err);
    }
  };

  const handleDeleteResume = async (cvId) => {
    if(window.confirm('Are you sure you want to delete this CV?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/profile/resume/${cvId}`, { 
          method: 'DELETE', 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          window.location.reload();
        } else {
          alert('Failed to delete CV');
        }
      } catch (err) {
        console.error('Failed to delete CV', err);
      }
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

      {profile?.resumes && profile.resumes.length > 0 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>My CVs</h3>
            </div>
            {profile.resumes.map((cv) => (
              <div key={cv._id || cv.filename} style={{ 
                width: '100%', 
                padding: '20px', 
                boxSizing: 'border-box',
                border: cv.isDefault ? '2px solid #28a745' : '1px solid #e0e0e0', 
                borderRadius: '8px', 
                backgroundColor: '#ffffff', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
              }}>
                
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    {cv.label || 'CV'}
                    {cv.isDefault && (
                      <span style={{ padding: '4px 10px', backgroundColor: '#e6f4ea', color: '#1e8e3e', border: '1px solid #1e8e3e', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                        Default CV
                      </span>
                    )}
                  </h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#444', wordBreak: 'break-all' }}>
                    <strong>File:</strong> {cv.filename}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                    <strong>Uploaded:</strong> {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleString() : 'Recently uploaded'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {!cv.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(cv._id)} 
                      style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}
                    >
                      Set as Default
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={() => handleDownloadResume(cv.filename, cv.label)}
                    style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f8f9fa', color: '#333', border: '1px solid #ccc', borderRadius: '4px', fontWeight: '500' }}
                  >
                    Download
                  </button>
                  
                  {cv.filename.toLowerCase().endsWith('.pdf') ? (
                    <button 
                      onClick={() => handlePreviewResume(cv.filename)} 
                      style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}
                    >
                      Preview
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert('Preview is only available for PDF files. Please download to view Word documents.')} 
                      style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500' }}
                    >
                      Preview (PDF Only)
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeleteResume(cv._id)} 
                    style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '500', marginLeft: 'auto' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {previewUrl && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              backgroundColor: 'rgba(20, 20, 25, 0.85)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              zIndex: 9999 
            }}>
              <div style={{ 
                backgroundColor: '#fff', 
                width: '90%', 
                maxWidth: '900px', 
                height: '90vh', 
                borderRadius: '8px', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                overflow: 'hidden'
              }}>
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', backgroundColor: '#ffffff', borderBottom: '1px solid #ddd' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '22px' }}>Resume Preview</h3>
                  <button 
                    onClick={() => setPreviewUrl(null)} 
                    style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                  >
                    ✕ Close Preview
                  </button>
                </div>
                
                <iframe 
                  src={previewUrl} 
                  width="100%" 
                  height="100%" 
                  title="Resume PDF Preview" 
                  style={{ border: 'none', flexGrow: 1, backgroundColor: '#525659' }} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={() => navigate('/profile/edit')} style={{ marginTop: '20px' }}>
        Edit Profile
      </button>
    </div>
  )
}

export default Profile