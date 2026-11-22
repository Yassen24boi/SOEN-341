# AI Feature 1: Resume Feedback

User stories: US-33 (resume feedback), US-36 (feedback tailored to a job), US-38 (validation).

## 1. Purpose

Job seekers get specific feedback on an uploaded CV so they can improve it before applying. There are two kinds:

- **General feedback:** strengths, weaknesses and 3 to 5 suggestions.
- **Tailored feedback:** compares the CV with one job posting and lists the job's skills the CV shows, the ones it is missing, and 3 to 5 suggestions for that job.

Every result is saved, so the user can look back at earlier feedback on their profile page.

## 2. Inputs

- The text of the user's CV, read from the uploaded PDF (`pdf-parse`) or DOCX (`mammoth`) file. Old `.doc` files and image-only scans give no text.
- For tailored feedback: the job's title, company, requirements and description.

Where it runs in the app:

- Profile page: "Get AI feedback" on each CV, with an optional job picker.
- Job details page: "Get AI feedback for this job", which uses the default CV.
- API: `POST /api/resumes/:id/feedback` (`:id` can be `default`, body `{ jobId }` is optional) and `GET /api/resumes/feedback/history`.

## 3. Model and prompt settings

| Setting | Value |
|---|---|
| Model | `qwen2.5:7b`, run locally by [Ollama](https://ollama.com). Free, no API key. Can be changed with `OLLAMA_MODEL` in `server/.env`. |
| Temperature | 0.2 (focused, repeatable answers) |
| Context size | 16,384 tokens (`num_ctx`), so a full CV and job fit without being cut |
| Output format | Ollama is given a JSON schema, so the answer is always JSON with the expected lists |
| Timeout | 30 seconds |
| Code | `server/services/resumeFeedback.js` (prompts), `server/services/ollamaClient.js` (model call) |

Main prompt rules:

- Refer to what is actually written in the CV; only call something missing if it really is.
- Only count a skill as matched if the CV mentions it, using the job's own wording.
- Never invent facts, numbers or achievements; use a placeholder like `[X%]` instead.
- The CV and job are wrapped in `<cv>` and `<job>` tags, and the model is told to ignore any instructions written inside them (protection against prompt injection).

## 4. Expected output

- General: `{ strengths: [...], weaknesses: [...], suggestions: [3 to 5 items] }`
- Tailored: `{ matchedSkills: [...], missingSkills: [...], suggestions: [3 to 5 items] }`

The page shows the lists under an "AI-generated" label with "Review these suggestions before changing your CV."

## 5. Validation strategy

- **Grounding check** (`server/services/groundingCheck.js`), applied to every answer before the user sees it:
  - A strength that names a skill not in the CV is removed.
  - A "matched" skill must be in the CV and be something the job asks for. A "missing" skill must appear in the job.
  - A "missing" skill that the CV does show (for example the job asks for SQL and the CV says MySQL) is moved to "matched".
  - A percentage in a suggestion that is not in the CV is replaced with `[X%]`.
- **Unit tests** with the AI replaced by a fake: correct answers, invalid JSON, missing lists, too few suggestions, timeouts, and every grounding rule (`server/tests/resumeFeedback.test.js`, `groundingCheck.test.js`, `resumeRoutes.test.js`).
- **Test set of 10 CVs** (`server/tests/fixtures/cvs/`): representative CVs plus edge cases (empty, image-only scanned PDF, very long, French, minimal, non-tech). `npm run validate:ai` runs both features on all of them with the real model and writes the [validation report](validation-report.md), which a team member then reviews.

## 6. Limitations

- A 7-billion-parameter local model is less accurate than large hosted models. It can miss a skill the CV has or phrase advice generically; the grounding check catches skills it invents, but not every missed skill.
- The grounding check only knows about 84 common tech skills. A made-up soft skill or employer name is not caught automatically, which is why the validation report is also reviewed by a person.
- Scanned (image-only) PDFs and old `.doc` files can't be read; there is no OCR.
- Feedback is in English, even for a French CV.
- Each request takes about 3 to 15 seconds, or up to 30 seconds the first time while the model loads. Each user is limited to 5 requests per hour.
- Ollama must be installed and running on the machine that runs the server.

## 7. Privacy

- CVs never leave the computer running the server: the model runs locally, so no CV text is sent to any outside company.
- Users can only get feedback on, and see the history of, their own CVs. Another user's CV id returns 404.
- Saved feedback is stored in our MongoDB database with the user's id; it contains the AI's comments, not the CV text.

## 8. Failure handling

| Situation | What the user sees |
|---|---|
| No text in the CV (scanned PDF, empty file, `.doc`) | "We couldn't read text from this CV. Please upload a PDF or DOCX file with selectable text." The AI is not called (AT-38.2). |
| Ollama off, too slow (over 30 s) or an unusable answer | "Feedback is unavailable, try again later". The rest of the app keeps working (AT-33.2). |
| No CV uploaded (job page button) | "Upload a CV to your profile first" with a link to the profile |
| More than 5 requests in an hour | "You can ask for feedback 5 times per hour. Please try again later." |
| Job deleted or invalid | "Job not found" |