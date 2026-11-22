# AI Feature 2: Job Matching Suggestions

User stories: US-34 (job matching), US-37 (show recommendations), US-38 (validation).

## 1. Purpose

Job seekers see the open jobs that best fit their profile and CV, each with a match score and a one-line reason, so they find good matches faster. The "Recommended for you" box is on the Jobs page and the My Job Applications dashboard.

## 2. Inputs

- From the user's profile: headline, summary, skills, past job titles and education.
- The text of the user's default CV, if they uploaded one.
- Open jobs: only jobs that are open and not past their deadline, never closed, archived or already applied to.

API: `GET /api/jobs/recommended` (logged-in job seekers).

## 3. Model and prompt settings

| Setting | Value |
|---|---|
| Model | `qwen2.5:7b`, run locally by Ollama (same set-up as resume feedback) |
| Temperature | 0.2 |
| Output format | JSON schema: `{ matches: [{ jobNumber, score, reason }] }` |
| Timeout | 30 seconds |
| Code | `server/services/jobMatching.js`, route in `server/routes/jobRoutes.js` |

How a request works:

1. A profile summary is built from the profile and CV text. With no skills and no CV, the user is asked to complete their profile instead.
2. **Pre-filter:** jobs are ranked by how many words they share with the profile, and the best 40 are kept. Jobs sharing no words at all are left out.
3. The jobs are sent to the model as a numbered list ("2. Java Developer at Maple Tech (...)"). Numbers are used instead of database ids because small models copy long ids wrong.
4. The model scores each job from 0 to 100 and gives a reason. The prompt tells it to treat the profile and jobs as data and ignore instructions inside them.
5. The answer is checked, and the top 5 matches at 40% or more are shown.
6. **Cache:** the result is saved per user and reused until the profile, default CV or job list changes, so a repeat visit takes under a second instead of 5 to 15.

## 4. Expected output

Up to 5 jobs, best first, each with `matchScore` (40 to 100) and a one-sentence `reason` that mentions the user's relevant skills, shown under an "AI-generated" label. If nothing fits well: "No strong matches right now. Adding more skills to your profile or uploading a CV can help."

## 5. Validation strategy

- **Answer checks:** job numbers that don't exist, jobs listed twice and empty reasons are dropped; scores are kept between 0 and 100; matches under 40% are hidden.
- **Grounding check:** a reason that names a skill which is in neither the profile nor the job is replaced with "Matches parts of your profile."
- **Unit and route tests** with the AI replaced by a fake: ranking, top 5, 40% cutoff, pre-filter, cache keys, refresh after a profile change or an application, closed/archived/applied jobs excluded (`server/tests/jobMatching.test.js`, `jobRecommendations.test.js`, `recommendationCache.test.js`, `groundingCheck.test.js`).
- **Test set:** `npm run validate:ai` also runs job matching for every test CV against 8 sample jobs (`server/tests/fixtures/jobs.json`) and records the results in the [validation report](validation-report.md). For example, the Java CV gets "Java Backend Developer" first, the chef CV only gets "Line Cook", and the minimal CV gets "No strong matches".

## 6. Limitations

- Scores come from a small local model and are estimates, not a guarantee of fit.
- The word-based pre-filter can leave out a job that is a good fit but uses completely different words from the profile.
- At most 40 jobs are ranked per request, to keep it fast.
- The cache lives in the server's memory, so it is emptied when the server restarts.
- Reasons can still be generic ("skills match the requirements").

## 7. Privacy

- Profile and CV text are only sent to the local model on the server's own machine, never to an outside service.
- A user only ever sees their own recommendations; the route uses the logged-in user's id.
- Recommendations are cached in memory only, not stored in the database.

## 8. Failure handling

| Situation | What the user sees |
|---|---|
| No skills on the profile and no CV | "Add your skills to your profile or upload a CV to get job recommendations." with a "Complete your profile" link (AT-34.2) |
| No job fits well (all under 40%, or no shared words) | "No strong matches right now..." |
| Ollama off, too slow or an unusable answer | "Recommendations are unavailable, try again later". The rest of the Jobs page works normally. |
| CV file can't be read | Matching continues with the profile only |