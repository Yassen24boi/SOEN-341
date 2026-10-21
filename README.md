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
## Running CareerConnect Locally

I wrote this section so anyone on the team (or the TA) can install and run CareerConnect on their own computer, step by step. The project has two parts that run at the same time: the **client** (the React frontend you see in the browser) and the **server** (the Node.js/Express backend that talks to MongoDB Atlas). You need both running to use the app.

### What you need first

- **Node.js** (LTS version) from [nodejs.org](https://nodejs.org). This also installs `npm`.
- **Git** from [git-scm.com](https://git-scm.com).
- A code editor like VS Code (optional, but helpful for creating the `.env` file).
- Two things only I can give you: the **`.env` file contents** (Step 4) and **access to our MongoDB Atlas cluster** (Step 5).

To check that Node and Git installed correctly, open a terminal and run:

```bash
node -v
npm -v
git --version
```

Each one should print a version number. If you get "not recognized," close and reopen the terminal (or restart the computer) and try again.

### Step 1: Clone the repository

```bash
git clone https://github.com/Yassen24boi/SOEN-341.git
cd SOEN-341
```

If my feature branch hasn't been merged yet, switch to it:

```bash
git checkout feature/profile-resume-upload
```

### Step 2: Install the server dependencies

```bash
cd server
npm install
```

This downloads everything the backend needs (Express, Mongoose, bcryptjs, jsonwebtoken, multer, cors, dotenv, and so on). It can take a minute.

### Step 3: Install the client dependencies

From the project root, open the client folder and install there too:

```bash
cd ../client
npm install
```

The server and client each have their own `node_modules`, which is why you run `npm install` twice.

### Step 4: Create the server `.env` file

Inside the `server` folder, create a file named exactly `.env` (with the dot at the start and no `.txt` on the end). It holds the MongoDB Atlas connection string and the JWT secret.

I'm not putting these values in the repo because they are secrets. **Message me and I'll send you the contents privately.** Paste them into the file as I give them to you. The variable names have to match exactly, including capitalization, or the server will crash on startup.

The `.env` file is listed in `.gitignore`, so it won't get committed. Please don't remove it from there, and don't paste its contents in GitHub issues, pull requests, or the group chat.

### Step 5: Get your IP address allowed in MongoDB Atlas

Our database only accepts connections from approved IP addresses. If yours isn't on the list, the server fails with an error like *"Could not connect to any servers in your MongoDB Atlas cluster."*

Tell me, and I'll add your IP in Atlas under **Network Access → Add IP Address**. If you switch networks (home, campus, a hotspot), your IP changes and you may need to be added again.

### Step 6: Start the backend

In one terminal:

```bash
cd server
npm run dev
```

You should see both of these messages:

```
Server running on port 5000
MongoDB connected
```

If you see the first but not the second, go back to Steps 4 and 5. Leave this terminal open.

### Step 7: Start the frontend

Open a **second** terminal:

```bash
cd client
npm run dev
```

It prints a local address, usually `http://localhost:5173`. Open it in your browser.

### Step 8: Try the Sprint 1 features

| Page | What to try |
|------|-------------|
| `/create-account` | Register a new user with a name, email, and password |
| `/login` | Log in with that account; you should see a welcome message |
| `/profile` | Edit your profile (like the headline) and upload a PDF/DOC/DOCX resume |

A few things worth knowing while you test:

- Passwords are hashed with bcrypt before they are saved, so no one can read them in the database.
- When you log in, the server sends back a JSON Web Token (JWT). The frontend stores it in `localStorage`, and that is how the app knows you're logged in.
- Registered accounts are saved in MongoDB Atlas, in the `careerconnect` database, in the `users` collection.
- Uploaded resumes are renamed with the user's ID and a timestamp, so two files with the same name never overwrite each other.

### Troubleshooting

| Problem | Likely cause and fix |
|---------|----------------------|
| `npm` is not recognized | Node.js isn't installed, or the terminal needs to be reopened after installing it |
| Server crashes right after starting | The `.env` file is missing, misnamed, or has the wrong variable names (Step 4), or your IP isn't allowed in Atlas (Step 5) |
| "Could not connect to any servers in your MongoDB Atlas cluster" | Your IP isn't on the Atlas allowlist; ask me to add it |
| The page loads but login or register does nothing | The backend isn't running. Both terminals have to stay open |
| Login fails silently | Open your browser's dev tools (F12) and check the Console and Network tabs for the real error |
| Port already in use | Another program is using port 5000 or 5173; close it, or restart the computer |
| `git pull` says there are unfinished merges or conflicts | Finish or abort the merge first (`git status` tells you which), then pull again |

If something still doesn't work, send me the exact error message from the terminal and I'll help you sort it out.

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

