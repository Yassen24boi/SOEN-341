import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function EditProfile(){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [experience, setExperience] = useState([])
  const [education, setEducation] = useState([])
  const [errors, setErrors] = useState({})

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeFileName, setResumeFileName] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const [isEditingResume, setIsEditingResume] = useState(false)
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
        setLocation(data.location || '')
        setPhone(data.phone || '')
        setSummary(data.summary || '')
        setSkills(data.skills ? data.skills.join(', ') : '')
        setPortfolio(data.links?.portfolio || '')
        setLinkedin(data.links?.linkedin || '')
        setGithub(data.links?.github || '')
        
        // Format dates correctly for HTML date inputs (YYYY-MM-DD)
        const formattedExp = (data.experience || []).map(exp => ({
          ...exp,
          from: exp.from ? exp.from.substring(0, 10) : '',
          to: exp.to ? exp.to.substring(0, 10) : ''
        }))
        setExperience(formattedExp)

        const formattedEdu = (data.education || []).map(edu => ({
          ...edu,
          from: edu.from ? edu.from.substring(0, 10) : '',
          to: edu.to ? edu.to.substring(0, 10) : ''
        }))
        setEducation(formattedEdu)

        setResumeFileName(data.resumeFileName || null)
      } catch (err) {
        console.error(err)
        alert('Could not reach the server')
      } finally {
        setLoading(false)
      }
    }
    if (token) loadProfile()
    else setLoading(false)
  }, [token])

  const addExperience = () => {
    setExperience([...experience, { title: '', company: '', location: '', from: '', to: '', current: false, description: '' }])
  }

  const removeExperience = (index) => {
    const newExp = [...experience];
    newExp.splice(index, 1);
    setExperience(newExp);
  }

  const addEducation = () => {
    setEducation([...education, { school: '', degree: '', fieldOfStudy: '', from: '', to: '', current: false }])
  }

  const removeEducation = (index) => {
    const newEdu = [...education];
    newEdu.splice(index, 1);
    setEducation(newEdu);
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setErrors({})

    // Validate experience timeline constraints
    for (let i = 0; i < experience.length; i++) {
      const exp = experience[i]
      if (exp.from && exp.to && !exp.current) {
        if (new Date(exp.to) < new Date(exp.from)) {
          alert(`Experience #${i + 1}: End date cannot be before the start date.`)
          return
        }
      }
    }

    try {
      const payload = {
        fullName, email, headline, location, phone, summary,
        skills,
        links: { portfolio, linkedin, github },
        experience,
        education
      }

      const profileRes = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const profileData = await profileRes.json()
      
      if (!profileRes.ok) {
        if (profileData.errors) setErrors(profileData.errors)
        else alert(profileData.message || 'Could not save profile')
        return
      }

      if (resumeFile) {
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
      navigate('/profile')
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

  if (!token) return <p>You must be logged in to view this page.</p>
  if (loading) return <p>Loading profile...</p>

  return (
    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1> Edit Profile </h1>

      <div className="form-row">
        <label htmlFor="fullName">Full Name:</label>
        <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="email">Email:</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="headline">Headline:</label>
        <div style={{ width: '100%' }}>
          <textarea id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="location">Location:</label>
        <div style={{ width: '100%' }}>
          <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="phone">Phone:</label>
        <div style={{ width: '100%' }}>
          <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', borderColor: errors.phone ? 'red' : '#ccc' }} />
          {errors.phone && <span style={{ color: 'red', fontSize: '12px' }}>{errors.phone}</span>}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="summary">Summary:</label>
        <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div className="form-row">
        <label htmlFor="skills">Skills (comma separated):</label>
        <input id="skills" type="text" value={skills} onChange={(e) => setSkills(e.target.value)} />
      </div>

      <div className="form-row">
        <label htmlFor="portfolio">Portfolio URL:</label>
        <div style={{ width: '100%' }}>
          <input id="portfolio" type="text" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} style={{ width: '100%', borderColor: errors.portfolio ? 'red' : '#ccc' }} />
          {errors.portfolio && <span style={{ color: 'red', fontSize: '12px' }}>{errors.portfolio}</span>}
        </div>
      </div>

      {/* Experience Section */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'left' }}>
        <h3>Experience</h3>
        {experience.map((exp, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', border: '1px solid #eee', padding: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => {
                const newExp = [...experience]; newExp[index].title = e.target.value; setExperience(newExp);
              }} style={{ flex: 1 }} />
              <input type="text" placeholder="Company" value={exp.company} onChange={(e) => {
                const newExp = [...experience]; newExp[index].company = e.target.value; setExperience(newExp);
              }} style={{ flex: 1 }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>Start Date:</label>
                <input type="date" value={exp.from ? exp.from.substring(0,10) : ''} onChange={(e) => {
                  const newExp = [...experience]; newExp[index].from = e.target.value; setExperience(newExp);
                }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block' }}>End Date:</label>
                <input 
                  type="date" 
                  value={exp.to && !exp.current ? exp.to.substring(0,10) : ''} 
                  disabled={exp.current} 
                  onChange={(e) => {
                    const newExp = [...experience]; newExp[index].to = e.target.value; setExperience(newExp);
                  }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: '18px' }}>
                <input 
                  type="checkbox" 
                  id={`current-${index}`} 
                  checked={exp.current} 
                  onChange={(e) => {
                    const newExp = [...experience]; 
                    newExp[index].current = e.target.checked; 
                    if(e.target.checked) newExp[index].to = ''; 
                    setExperience(newExp);
                  }} 
                />
                <label htmlFor={`current-${index}`} style={{ fontSize: '13px', marginLeft: '4px', marginRight: 'auto' }}>I still work here</label>
              </div>
            </div>
            <button type="button" onClick={() => removeExperience(index)} style={{ color: 'red', alignSelf: 'flex-start', marginTop: '8px' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addExperience}>+ Add Experience</button>
      </div>

      {/* Education Section */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'left' }}>
        <h3>Education</h3>
        {education.map((edu, index) => (
          <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', border: '1px solid #eee', padding: '10px' }}>
            <input type="text" placeholder="School" value={edu.school} onChange={(e) => {
              const newEdu = [...education]; newEdu[index].school = e.target.value; setEducation(newEdu);
            }} style={{ flex: '1 1 30%' }} />
            <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => {
              const newEdu = [...education]; newEdu[index].degree = e.target.value; setEducation(newEdu);
            }} style={{ flex: '1 1 30%' }} />
            <input type="text" placeholder="Field of Study" value={edu.fieldOfStudy} onChange={(e) => {
              const newEdu = [...education]; newEdu[index].fieldOfStudy = e.target.value; setEducation(newEdu);
            }} style={{ flex: '1 1 30%' }} />
            <button type="button" onClick={() => removeEducation(index)} style={{ color: 'red', flex: '1 1 100%', textAlign: 'left' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addEducation}>+ Add Education</button>
      </div>

      <div className="form-row" style={{ borderTop: '1px solid #ccc', paddingTop: '15px' }}>
        <label>Resume:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, height: '40px' }}>
          {resumeFileName && !isEditingResume ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: "100%"}}>
              <button type="button" style={{height: "100%"}} onClick={handleDownloadResume}>Download</button>
              <button type="button" style={{height: "100%"}} onClick={() => setIsEditingResume(true)}>Replace</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'row', gap: '6px' }}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} />
              {resumeFileName && (
                <button style={{width: "50%"}} type="button" onClick={() => { setIsEditingResume(false); setResumeFile(null); }}>
                  Cancel Replace
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="submit" style={{ flex: 1 }}>Save Profile</button>
        <button type="button" onClick={() => navigate('/profile')} style={{ flex: 1, backgroundColor: '#ccc', color: '#333' }}>Cancel</button>
      </div>
    </form>
  )
}

export default EditProfile