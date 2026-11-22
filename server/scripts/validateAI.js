// US-38 (Tasks 38.2, 38.3): runs both AI features on the test set of CVs with the real local AI
// and writes Documentation/AI/validation-report.md.
// Run it from the server folder with Ollama running:  npm run validate:ai
const fs = require('fs')
const path = require('path')
const { extractTextFromFile } = require('../services/resumeText')
const { getResumeFeedback, getTailoredFeedback } = require('../services/resumeFeedback')
const { buildProfileSummary, preselectJobs, recommendJobs } = require('../services/jobMatching')
const { findUnsupportedSkills } = require('../services/groundingCheck')

const FIXTURES = path.join(__dirname, '..', 'tests', 'fixtures')
const CV_DIR = path.join(FIXTURES, 'cvs')
const REPORT = path.join(__dirname, '..', '..', 'Documentation', 'AI', 'validation-report.md')
const JOBS = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'jobs.json'), 'utf8'))
// Tailored feedback is checked against this job for every CV
const TAILOR_JOB = JOBS.find((job) => job._id === 'job-fullstack')

async function readCv(file) {
  const filePath = path.join(CV_DIR, file)
  return file.endsWith('.txt') ? fs.readFileSync(filePath, 'utf8').trim() : extractTextFromFile(filePath)
}

// Runs one AI call, timing it and catching failures so one bad answer doesn't stop the whole run
async function timed(run) {
  const start = Date.now()
  try {
    return { result: await run(), seconds: ((Date.now() - start) / 1000).toFixed(1) }
  } catch (err) {
    return { error: err.message, seconds: ((Date.now() - start) / 1000).toFixed(1) }
  }
}

const list = (items) => (items && items.length ? items.map((item) => `  - ${item}`).join('\n') : '  - (none)')

async function validateCv(file) {
  const text = await readCv(file)
  const lines = [`### ${file}`, '']
  const row = { file, general: '-', tailored: '-', matching: '-', unsupported: 0, flagged: 0 }

  // AT-38.2: no text means the user is told we couldn't read it, and the AI is never called
  if (!text) {
    lines.push("No text could be read, so the app answers \"We couldn't read text from this CV\" and does not call the AI. **Pass (AT-38.2).**", '')
    row.general = row.tailored = row.matching = 'No text: correctly rejected'
    return { lines, row }
  }

  const general = await timed(() => getResumeFeedback(text))
  if (general.error) {
    row.general = `Failed: ${general.error}`
    lines.push(`**General feedback** failed after ${general.seconds}s: ${general.error}`, '')
  } else {
    const g = general.result
    const unsupported = g.strengths.flatMap((item) => findUnsupportedSkills(item, text))
    row.unsupported += unsupported.length
    row.flagged += g.flagged.length
    row.general = `${g.strengths.length} strengths, ${g.weaknesses.length} weaknesses, ${g.suggestions.length} suggestions (${general.seconds}s)`
    lines.push(`**General feedback** (${general.seconds}s)`, '- Strengths:', list(g.strengths), '- Weaknesses:', list(g.weaknesses),
      '- Suggestions:', list(g.suggestions), `- Removed by the grounding check: ${g.flagged.length ? g.flagged.join(' | ') : 'nothing'}`, '')
  }

  const tailored = await timed(() => getTailoredFeedback(text, TAILOR_JOB))
  if (tailored.error) {
    row.tailored = `Failed: ${tailored.error}`
    lines.push(`**Tailored to "${TAILOR_JOB.title}"** failed after ${tailored.seconds}s: ${tailored.error}`, '')
  } else {
    const t = tailored.result
    const unsupported = t.matchedSkills.flatMap((skill) => findUnsupportedSkills(skill, text))
    row.unsupported += unsupported.length
    row.flagged += t.flagged.length
    row.tailored = `${t.matchedSkills.length} matched, ${t.missingSkills.length} missing (${tailored.seconds}s)`
    lines.push(`**Tailored to "${TAILOR_JOB.title}"** (${tailored.seconds}s)`, '- Skills the CV shows:', list(t.matchedSkills),
      '- Missing skills:', list(t.missingSkills), '- Suggestions:', list(t.suggestions),
      `- Removed by the grounding check: ${t.flagged.length ? t.flagged.join(' | ') : 'nothing'}`, '')
  }

  const summary = buildProfileSummary(null, text)
  const matching = await timed(() => recommendJobs(summary, preselectJobs(summary, JOBS, 40)))
  if (matching.error) {
    row.matching = `Failed: ${matching.error}`
    lines.push(`**Job matching** failed after ${matching.seconds}s: ${matching.error}`, '')
  } else {
    const recs = matching.result
    row.flagged += recs.filter((r) => r.flagged).length
    row.matching = recs.length ? recs.map((r) => `${r.job.title} ${r.matchScore}%`).join(', ') : 'No strong matches'
    lines.push(`**Job matching** (${matching.seconds}s)`,
      list(recs.map((r) => `${r.job.title}: ${r.matchScore}%. ${r.reason}${r.flagged ? ` (reason replaced, it named: ${r.flagged.join(', ')})` : ''}`)), '')
  }
  return { lines, row }
}

async function main() {
  const files = fs.readdirSync(CV_DIR).sort()
  const details = []
  const rows = []
  for (const file of files) {
    console.log(`Checking ${file}...`)
    const { lines, row } = await validateCv(file)
    details.push(...lines)
    rows.push(row)
  }

  const report = [
    '# AI Features: Validation Report',
    '',
    `Generated by \`npm run validate:ai\` on ${new Date().toISOString().slice(0, 10)} with the local model \`${process.env.OLLAMA_MODEL || 'qwen2.5:7b'}\`.`,
    'Each CV in `server/tests/fixtures/cvs/` was run through general feedback, feedback tailored to the "Junior Full Stack Developer" job, and job matching against the 8 jobs in `server/tests/fixtures/jobs.json`.',
    '',
    '**Unsupported skills** counts skills named as a strength or matched skill that are not in the CV. It must be 0 (AT-38.1).',
    '**Removed** counts items the grounding check removed before the user saw them.',
    '',
    '| CV | General feedback | Tailored feedback | Job matching | Unsupported skills | Removed |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.file} | ${r.general} | ${r.tailored} | ${r.matching} | ${r.unsupported} | ${r.flagged} |`),
    '',
    '## Manual review',
    '',
    'Every output below was read by a team member to check that it is relevant to the CV and does not mention skills or employers that are not in the CV or the job. Write your findings here:',
    '',
    '- Reviewed by:',
    '- Findings:',
    '',
    '## Full outputs',
    '',
    ...details
  ].join('\n')

  fs.mkdirSync(path.dirname(REPORT), { recursive: true })
  fs.writeFileSync(REPORT, report + '\n')
  console.log(`\nReport written to ${REPORT}`)
  const unsupported = rows.reduce((sum, r) => sum + r.unsupported, 0)
  console.log(unsupported === 0 ? 'No unsupported skills in any output.' : `WARNING: ${unsupported} unsupported skills found.`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})