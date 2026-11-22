// US-38 (Task 38.4): checks that AI output only names skills that really appear in the input.
// The AI can "hallucinate" a skill the candidate never mentioned. We compare every known skill
// the AI names with the text it was given, and anything that isn't there is flagged.

// Skills we know how to recognise. Words that are also common English ("go", "rest", "express")
// are left out or written in a longer form so they aren't matched by mistake.
const SKILL_TERMS = [
  'java', 'spring', 'spring boot', 'python', 'javascript', 'typescript', 'react', 'react native', 'angular', 'vue',
  'node.js', 'express.js', 'next.js', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery',
  'sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'redis', 'firebase', 'graphql', 'rest api', 'rest apis',
  'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'jenkins', 'ci/cd', 'terraform',
  'c++', 'c#', '.net', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'rails', 'django', 'flask', 'fastapi',
  'android', 'ios', 'flutter', 'unity', 'figma', 'photoshop', 'illustrator', 'blender',
  'excel', 'power bi', 'tableau', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'machine learning',
  'matlab', 'spark', 'hadoop', 'kafka', 'jira', 'agile', 'scrum', 'selenium', 'jest', 'junit', 'cypress',
  'salesforce', 'sap', 'quickbooks'
]

// Knowing the skill on the left means you also know the ones on the right,
// so a CV that says "MySQL" supports the AI saying "SQL"
const IMPLIED_SKILLS = {
  mysql: ['sql'],
  postgresql: ['sql'],
  'spring boot': ['spring', 'java'],
  'react native': ['react', 'javascript'],
  'next.js': ['react', 'javascript'],
  'node.js': ['javascript'],
  'express.js': ['node.js', 'javascript'],
  typescript: ['javascript'],
  github: ['git'],
  gitlab: ['git'],
  'rest apis': ['rest api'],
  'rest api': ['rest apis'],
  django: ['python'],
  flask: ['python'],
  fastapi: ['python'],
  pandas: ['python'],
  rails: ['ruby']
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// One pattern per skill. A skill only counts when it isn't part of a longer word,
// so "java" doesn't match inside "javascript" and "sql" doesn't match inside "mysql".
const SKILL_PATTERNS = SKILL_TERMS.map((term) => ({
  term,
  pattern: new RegExp(`(?<![a-z0-9+#.])${escapeRegex(term)}(?![a-z0-9+#])`, 'i')
}))

// The known skills named in a piece of text
function skillsIn(text) {
  return SKILL_PATTERNS.filter(({ pattern }) => pattern.test(text || '')).map(({ term }) => term)
}

// The known skills a text supports: the ones it names, plus the ones they imply
function supportedSkills(sourceText) {
  const named = skillsIn(sourceText)
  return new Set([...named, ...named.flatMap((term) => IMPLIED_SKILLS[term] || [])])
}

// The known skills named in `text` that are not supported by `sourceText`
function findUnsupportedSkills(text, sourceText) {
  const supported = supportedSkills(sourceText)
  return skillsIn(text).filter((term) => !supported.has(term))
}

// True if an item names no known skill, or names at least one skill that `sourceText` asks for
// (directly, or through an implied skill: "MySQL" is relevant to a job asking for "SQL")
function isRelevantTo(item, sourceText) {
  const wanted = new Set(skillsIn(sourceText))
  const named = skillsIn(item)
  return named.length === 0 || named.some((term) => wanted.has(term) || (IMPLIED_SKILLS[term] || []).some((implied) => wanted.has(implied)))
}

// Replaces percentages that don't appear in `sourceText` with "[X%]", so suggestions never
// hand the user a made-up result such as "raised sales by 20%"
function placeholderNumbers(text, sourceText) {
  return text.replace(/\d+(?:\.\d+)?%/g, (number) => (sourceText.includes(number) ? number : '[X%]'))
}

// Splits a list into the items that only name skills supported by `sourceText`, and the ones that don't
function keepSupported(items, sourceText) {
  const kept = []
  const removed = []
  for (const item of items) {
    if (findUnsupportedSkills(item, sourceText).length > 0) removed.push(item)
    else kept.push(item)
  }
  return { kept, removed }
}

module.exports = { SKILL_TERMS, skillsIn, findUnsupportedSkills, keepSupported, isRelevantTo, placeholderNumbers }