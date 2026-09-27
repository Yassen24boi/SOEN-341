**Task ID/Title:** Implement Profile Management + Resume Upload backend (initial prototype)
**Purpose of AI Use:** Prototype the Sprint 1 "Resume Upload and Profile Management" feature
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Generated a Spring Boot ProfileController, UserProfile entity, UserProfileRepository, and a Thymeleaf profile.html template implementing profile editing and resume upload/download endpoints.
**Validation:** Read through the generated code and ran the app locally.
**Decision:** Rejected
**Reflection:** Built before the team's tech stack was confirmed. The team's actual stack is React/Node.js/MongoDB, not Java/Spring Boot, so this implementation was superseded and not used in the final submission. Lesson: confirm the team's stack decision before starting implementation.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Review self-written Login.jsx component
**Purpose of AI Use:** Sprint 1 "User Registration/Authentication" feature — frontend login form
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Identified that the label elements were not linked to their input fields (missing htmlFor/id pairing) and suggested the fix.
**Validation:** Applied the suggested fix and manually tested that clicking each label focuses the corresponding input.
**Decision:** Modified before use
**Reflection:** Accepted the accessibility fix (htmlFor/id); the rest of the component (state, form structure, submit handler) was my own and left unchanged.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Review self-written Profile.jsx component
**Purpose of AI Use:** Sprint 1 "Resume Upload and Profile Management" feature — frontend profile form
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Same htmlFor/id accessibility fix as Login.jsx; also flagged that combining "Create Account" and "My Profile" in one component/heading may need to be split into two separate components later.
**Validation:** Applied the label fix and tested manually; the component-split suggestion was noted but not acted on.
**Decision:** Modified before use
**Reflection:** Accepted the label fix. Deferred the create-account/profile split pending a team discussion, since it affects how the signup flow is structured.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Set up client-side routing in App.jsx
**Purpose of AI Use:** Make the Login and Profile pages reachable/navigable in the browser for the Sprint 1 demo
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Provided a react-router-dom-based App.jsx using BrowserRouter/Routes, mapping /login, /create-account, /profile, and / to the existing Login and Profile components.
**Validation:** Ran the app with "npm run dev" and manually navigated to each route in the browser to confirm the correct component rendered.
**Decision:** Accepted
**Reflection:** Used as provided with no changes; straightforward boilerplate for wiring existing components into routes.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Clarify README vs. Team Process document content
**Purpose of AI Use:** Meet the Sprint 1 documentation deliverables (README + team process doc)
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Outlined what belongs in each document per the assignment rubric: README covers project description, team, tech stack, setup, and features; the team process doc covers workflow, branching convention, PR process, code review expectations, and Definition of Ready/Done.
**Validation:** Cross-checked the breakdown against the Sprint 1 assignment instructions and rubric.
**Decision:** Accepted
**Reflection:** Used this structure to organize the two documents and avoid duplicating content between them.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Set up Node.js/Express backend project (server.js, config/db.js, MongoDB Atlas connection)
**Purpose of AI Use:** Sprint 1 backend skeleton needed to support the Registration/Authentication and Profile/Resume features
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Provided step-by-step guidance to scaffold the server folder, install dependencies (express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken, multer), create an Express entry point with a health-check route, and connect to a MongoDB Atlas cluster via a config/db.js module.
**Validation:** Ran the server locally with "npm run dev", debugged a folder-location mistake, a missing scripts entry in package.json, a mismatched .env variable name, and a MongoDB Atlas authentication error, then confirmed a successful "MongoDB connected" message and a working /api/health response in the browser.
**Decision:** Accepted
**Reflection:** Followed the guidance step by step and typed the code myself rather than pasting a finished server; needed multiple rounds of debugging (env var casing, missing file, Atlas password mismatch) before it worked, which helped me understand the moving pieces rather than just copying a working result.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Build User model with password hashing (models/User.js)
**Purpose of AI Use:** Define the user data schema (job seeker / recruiter) needed for registration and login
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Provided a Mongoose schema for User (fullName, email, password, role, headline, resumeFileName) with a pre-save hook that hashes the password using bcryptjs, and a comparePassword instance method for login checks.
**Validation:** Used it directly in the auth routes; hit a runtime error ("next is not a function") caused by an outdated next-callback pattern that didn't match the installed Mongoose version, fixed by switching the pre-save hook to a plain async function with no next parameter, then confirmed in MongoDB Atlas's Data Explorer that a created user's password field was stored as a hash, not plain text.
**Decision:** Modified before use
**Reflection:** Accepted the schema and hashing approach, but had to correct the pre-save hook signature for compatibility with the installed Mongoose version. Good reminder that AI-suggested code can rely on APIs that differ between library versions and needs to actually be run, not just read, before trusting it.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Build register/login auth routes (routes/authRoutes.js)
**Purpose of AI Use:** Sprint 1 "User Registration and Authentication" feature — backend API
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Provided POST /api/auth/register and POST /api/auth/login route handlers: register checks for an existing email, creates the user (password hashed via the model), and returns a signed JWT; login looks up the user, compares the password, and returns a JWT on success, using an identical generic error message for a wrong email or password.
**Validation:** Wired the routes into server.js, tested both endpoints manually with PowerShell's Invoke-RestMethod (register a new user, attempt login with the same credentials), and confirmed both returned valid JWT tokens and the expected user fields.
**Decision:** Accepted
**Reflection:** Used as provided. Manually testing each endpoint with real requests (rather than just reading the code) is what caught the pre-save hook bug above, so I plan to keep testing every new route this way.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Connect Login.jsx to the real /api/auth/login endpoint
**Purpose of AI Use:** Make the Sprint 1 "User Registration and Authentication" feature demoable end-to-end in the browser
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Replaced the placeholder alert in Login.jsx's onSubmit with a real fetch call to the backend, storing the returned JWT in localStorage on success and showing the logged-in user's name.
**Validation:** Tested in the browser with dev tools (Console and Network tabs) after the request initially failed silently; found and fixed a typo ("passowrd" instead of "password" in the request body) and a template-literal bug (single quotes instead of backticks) that were breaking the request before it ever reached the server. Confirmed a successful login shows the real username, and an incorrect password shows a proper error instead of crashing.
**Decision:** Modified before use
**Reflection:** The AI-provided fetch code was correct; the bugs were introduced while typing it in myself. The debugging process was the actual learning here, and I added a console.error(err) afterward so a similar mistake would be visible next time.
**Responsible Person:** Michel Yosufov

---

**Task ID/Title:** Build profile routes and auth middleware (routes/profileRoutes.js, middleware/auth.js)
**Purpose of AI Use:** Sprint 1 "Resume Upload and Profile Management" feature — backend API
**Chat Link or Prompt/Response:** https://claude.ai/code/session_019obdut6J7ggJhg2X6z7mRR
**AI-Suggested Content:** Provided a requireAuth middleware that verifies a JWT and identifies the logged-in user, plus GET/PUT /api/profile (view/update profile) and POST/GET /api/profile/resume (upload/download resume via multer) routes.
**Validation:** Tested all three routes with real requests (PowerShell Invoke-RestMethod for profile view/update, curl for the multipart file upload). Hit a casing bug (req.userID / decoded.userID instead of req.userId / decoded.userId) that caused "User not found" even with a valid token; fixed by correcting the casing, then confirmed profile view, profile update, and resume upload all worked and persisted correctly to MongoDB Atlas.
**Decision:** Modified before use
**Reflection:** Same lesson as the Mongoose bug — a small casing mismatch between two files (auth middleware vs. route handler) silently broke the feature, and it only surfaced by actually testing the request end-to-end rather than just reading the code.
**Responsible Person:** Michel Yosufov

---
