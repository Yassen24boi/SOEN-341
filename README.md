# SOEN-341 
------------------------
## Identified Problem
Job seekers often struggle to maintain organization across multiple job platforms, leading to missed application deadlines, duplicate submissions, and difficulty tracking interview progress. On the employer side, recruiters need efficient ways to manage job postings and identify qualified candidates without sifting through disorganized application channels.

---

## Project Description
CareerConnect	is	a	web-based	platform	designed	to	help	job	seekers	manage	their	job	search	activities.	
The	system	allows	users	to	create	profiles,	upload	and	manage	resumes,	search	for	job	opportunities,	
track	submitted	applications,	and	follow	the	progress	of	their	application	process.	The	platform	aims	
to	centralize	job-search	activities	and	help	users	stay	organized	throughout	their	career	development	
journey.

---

## Team Members & Roles

| Name | Student ID | Role / Main Focus |
| :--- | :--- | :--- |
| Yassen Hegazy | `40298119` | Frontend Lead / UI Design |
| Julia Kyrychuk | `40299305` | Backend Lead / Database |
| Noor Rabie | `40319050` | QA & Testing Specialist |
| Jose David Torres | `40330646` | Full-stack Developer / AI Integration |
| Michel Yosufov | `40327623` | Frontend Lead / UI Design |

---

## Key Features 
- **Authentication & Profiles:** User registration, secure login, and customizable candidate/recruiter profiles.
- **Resume Management:** Upload, versioning, and management of candidate resumes.
- **Job Board & Filtering:** Recruiter job postings with advanced search and filtering (by role, location, salary, type).
- **Application Tracking System (ATS):** Real-time status tracking (*Applied*, *Interview*, *Offered*, *Rejected*).
- **Dashboard & Organization:** Personal application history dashboard, saved job favorites, and deadline notifications.

---

## Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js
- **Database:** MongoDB
- **AI Integration:** 
- **CI/CD & DevOps:** GitHub Actions, Docker
- **Testing:** Jest

---

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

## 🔄 Team Process & Git Workflow

### Branching Strategy
We adopt a modified **GitFlow / Feature Branching** strategy:
- `main`: Production-ready code.
- `develop`: Integration branch for completed features.
- `feature/<issue-id>-short-description`: Individual feature work (e.g., `feature/#12-user-login`).
- `bugfix/<issue-id>-short-description`: Patch/bug fix branches.

### Pull Request (PR) & Code Review Process
1. All work must be linked to a GitHub Issue.
2. PRs must target the `develop` branch.
3. At least **one peer code review** and approval is required before merging.
4. All automated CI checks (linting, tests) must pass.

### Definition of Ready (DoR)
A user story or task is Ready for implementation when:
- Story title, criteria, and clear acceptance criteria are defined.
- Story points / effort estimates are assigned.
- Dependencies are identified and resolved.

### Definition of Done (DoD)
A task is Done when:
- Code is fully implemented and formatted according to team guidelines.
- Unit/integration tests are written and passing.
- Code reviewed and approved by at least one team member.
- Branch merged into `develop` without merge conflicts.
- Documentation and AI logs updated (if applicable).

---

## 📂 Repository Structure

```text
CareerConnect/
├── .github/              # Issue templates, PR templates, workflows
├── client/               # Frontend source code
├── server/               # Backend source code and APIs
├── docs/                 # Documentation & meeting minutes
│   └── meeting_minutes/  # Sprint meeting notes
├── AI_Log/               # Individual GenAI usage logs
│   ├── Member_1/
│   ├── Member_2/
│   ├── Member_3/
│   └── Member_4/
├── README.md             # Project README
└── LICENSE
```

---

## 📝 Sprint 1 Focus & Deliverables
During Sprint 1, the team focused on project initialization, architecture planning, requirement elicitation, and implementing initial working features:
1. **Demonstrated Feature 1:** User Registration and Authentication (Login/Signup).
2. **Demonstrated Feature 2:** Resume Upload and User Profile Management.