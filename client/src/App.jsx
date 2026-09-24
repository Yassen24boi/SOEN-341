import { useState } from 'react'
import './App.css'

function App() {

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [headline, setHeadline] = useState('')
  const [resumeFile, setResumeFile] = useState(null)

  return (
    <div>
    <h1>My Profile</h1>

    <label> Full Name: </label>
    <input
     type ="text"
     value={fullName}
     onChange={() => setFullName(e.target.value)}
     />

    <label>  Email: </label>
    <input
     type ="email"
     value={email}
     onChange={() => setEmail(e.target.value)}
     />

    <label>  Headline: </label>
    <input
     type ="text"
     value={headline}
     onChange={() => setHeadline(e.target.value)}
     />

    <label> Resume: </label>
    <input
    type = "file"
    accept= ".pdf, .doc, .docx"
    onChange={(e) => setResumeFile(e.target.files[0])}
    />

    {resumeFile && <p>Selected file: {resumeFile.name}</p>}
    <br />
    <button onClick={()=> alert('profile saved (for now, just local - no backend yet)!')}>
      save Profile
      </button>
    </div>
  )
}

export default App
