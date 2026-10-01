# SOEN-341 
------------------------
## Identified Problem
Job seekers often struggle to maintain organization across multiple job platforms, leading to missed application deadlines, duplicate submissions, and difficulty tracking interview progress. On the employer side, recruiters need efficient ways to manage job postings and identify qualified candidates without sifting through disorganized application channels.

------------------------
## Project Description

CareerConnect	is	a	web-based	platform	designed	to	help	job	seekers	manage	their	job	search	activities.	
The	system	allows	users	to	create	profiles,	upload	and	manage	resumes,	search	for	job	opportunities,	
track	submitted	applications,	and	follow	the	progress	of	their	application	process.	The	platform	aims	
to	centralize	job-search	activities	and	help	users	stay	organized	throughout	their	career	development	
journey.

------------------------
## Solution 

CareerConnect provides a centralized web-based solution that simplifies the job application process for both job seekers and recruiters. Instead of requiring job seekers to manage applications, resumes, deadlines, and interview updates across multiple platforms, CareerConnect brings these activities together in one organized system.

Job seekers can create profiles, manage resumes, search and filter job opportunities, submit applications, and track each application's progress through different stages such as Applied, Interview, Offered, and Rejected. Recruiters can create and manage job postings, review candidate applications, and update application statuses.

By centralizing these features, CareerConnect aims to reduce missed opportunities and duplicate applications while providing both job seekers and recruiters with a clearer and more organized recruitment process.

------------------------

## Team Members

| Name | Student ID |
| :--- | :--- | 
| Yassen Hegazy | `40298119` | 
| Julia Kyrychuk | `40299305` | 
| Noor Rabie | `40319050` |
| Jose David Torres | `40330646` | 
| Michel Yosufov | `40327623` |

------------------------

## Key Features 

- **Authentication & Profiles:** User registration, secure login, and customizable candidate/recruiter profiles.
- **Resume Management:** Upload, versioning, and management of candidate resumes.
- **Job Board & Filtering:** Recruiter job postings with advanced search and filtering (by role, location, salary, type).
- **Application Tracking System (ATS):** Real-time status tracking (*Applied*, *Interview*, *Offered*, *Rejected*).
- **Dashboard & Organization:** Personal application history dashboard, saved job favorites, and deadline notifications.

------------------------

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js
- **Database:** MongoDB
- **AI Integration:** 
- **CI/CD & DevOps:** GitHub Actions, Docker
- **Testing:** Jest

------------------------

## Development Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [Git](https://git-scm.com/)
- API Key for AI Service (if running hosted model)

### Local Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/YourOrganization/CareerConnect.git
   cd CareerConnect
   ```

2. **Install Dependencies:**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `server` directory with the following variables:
   ```env
   PORT=5000
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_jwt_secret_key
   AI_API_KEY=your_openai_or_external_api_key
   ```

4. **Run the Application:**
   ```bash
   # Start backend server
   cd server
   npm start

   # Start frontend application (in a new terminal)
   cd client
   npm start
   ```
   Open `http://localhost:3000` in your browser.

---

## 📂 Repository Structure

```text
CareerConnect/
├── .github/              # Issue templates, PR templates, workflows
├── Sprint_Deliverables/  # Frontend source code
├── Documentation/        # Documentation & meeting minutes
│   └── meeting_minutes/  # Sprint meeting notes
├── AI_Log/               # Individual GenAI usage logs
│   ├── Member_1/
│   ├── Member_2/
│   ├── Member_3/
│   └── Member_4/
├── README.md             # Project README
└── client
```

