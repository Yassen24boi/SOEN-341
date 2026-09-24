import { useState } from "react"

function Profile(){
const [fullName, setFullName] = useState('')
const [email, setEmail] = useState('')
const [headline, setHeadline] = useState('')
const [resumeFile, setResumeFile] = useState(null)

return (
  <form onSubmit={(e) => {
      e.preventDefault()
      alert('Profile saved (for now, just local — no backend yet)!')
    }}>
<h1> Create Account / My Profile </h1>

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

     {resumeFile && <p>Selected file: {resumeFile.name}</p>}
      <br />
      <button type="submit">Save Profile</button>

</form>
)

}

export default Profile