// US-38 (Task 38.2): creates the test set used to validate the AI features:
// 10 CVs in server/tests/fixtures/cvs/ (normal ones plus edge cases) and 8 jobs in server/tests/fixtures/jobs.json.
// Run it once from the server folder:  node scripts/createTestSet.js
const fs = require('fs')
const path = require('path')

const FIXTURES = path.join(__dirname, '..', 'tests', 'fixtures')
const CV_DIR = path.join(FIXTURES, 'cvs')

const CVS = {
  '01-java-backend.txt': [
    'Samir Haddad', 'Montreal, QC | samir.haddad@email.com | github.com/samirh', '',
    'SUMMARY', 'Software engineering student focused on backend development.', '',
    'EDUCATION', 'B.Eng. Software Engineering, Concordia University (expected 2027)', '',
    'SKILLS', 'Java, Spring Boot, MySQL, Git, Docker, JUnit', '',
    'EXPERIENCE', 'Backend Developer Intern - Lumen Labs (Summer 2026)',
    '- Built 6 REST APIs in Spring Boot used by 2,000 daily users',
    '- Cut slow database queries from 2s to 300ms by adding MySQL indexes',
    '- Wrote JUnit tests that raised coverage from 40% to 75%', '',
    'PROJECTS', 'CareerConnect - job search platform (team of 5)', '- Designed the job search API and pagination',
    'Library System - Java desktop app for managing book loans'
  ],
  '02-react-frontend.txt': [
    'Lea Tremblay', 'Laval, QC | lea.tremblay@email.com | portfolio: leatremblay.dev', '',
    'EDUCATION', 'B.Comp.Sc., Concordia University (expected 2026)', '',
    'SKILLS', 'JavaScript, React, HTML, CSS, Figma, Git', '',
    'PROJECTS', 'Weather App - React app showing a 5-day forecast from a public weather API',
    'Portfolio site - personal website built with React and CSS animations',
    'Recipe Finder - search recipes by ingredient, built with JavaScript', '',
    'EXPERIENCE', 'Teaching Assistant, Intro to Web Development (2025-2026)', '- Helped 60 students debug HTML and CSS assignments'
  ],
  '03-data-analyst.txt': [
    'Priya Nair', 'Toronto, ON | priya.nair@email.com', '',
    'EDUCATION', 'B.Sc. Statistics, University of Toronto (2025)', '',
    'SKILLS', 'Python, pandas, SQL, Excel, Tableau', '',
    'EXPERIENCE', 'Data Analyst Intern - Summit Bank (2025)',
    '- Built a Tableau dashboard tracking loan approvals across 12 branches',
    '- Automated a weekly Excel report with Python, saving 4 hours per week', '',
    'PROJECTS', 'Housing prices analysis - cleaned and analysed 50,000 listings with pandas'
  ],
  // A career changer whose experience bullets only list duties
  '04-retail-career-changer.txt': [
    'Marc Dubois', 'Montreal, QC | marc.dubois@email.com', '',
    'EXPERIENCE', 'Cashier - Metro Grocery (2021-2025)', '- Worked the cash register', '- Helped customers',
    'Stock Clerk - Dollarama (2019-2021)', '- Stocked shelves', '',
    'EDUCATION', 'DEC in Computer Science, Dawson College (in progress)', '',
    'SKILLS', 'Customer service, teamwork, basic HTML'
  ],
  // Edge case: not related to tech at all
  '05-chef-non-tech.txt': [
    'Giulia Rossi', 'Montreal, QC | giulia.rossi@email.com', '',
    'EXPERIENCE', 'Sous Chef - Trattoria Roma (2020-2026)', '- Managed a kitchen team of 6 cooks',
    '- Designed a seasonal menu that raised dinner sales by 15%', 'Line Cook - Le Petit Bistro (2017-2020)', '',
    'EDUCATION', 'Diploma in Professional Cooking, ITHQ (2017)', '',
    'SKILLS', 'Menu planning, food safety (MAPAQ certified), inventory, team leadership'
  ],
  // Edge case: not in English
  '06-french-cv.txt': [
    'Camille Gagnon', 'Québec, QC | camille.gagnon@courriel.com', '',
    'PROFIL', "Étudiante en génie logiciel à la recherche d'un stage en développement web.", '',
    'FORMATION', 'Baccalauréat en génie logiciel, Université Laval (prévu 2027)', '',
    'COMPÉTENCES', 'JavaScript, React, Node.js, MongoDB, Git', '',
    'EXPÉRIENCE', 'Développeuse stagiaire - Cedar Apps (été 2026)',
    "- Développé 3 pages en React pour l'application mobile web", '- Corrigé 25 bogues signalés par les utilisateurs'
  ],
  // Edge case: almost nothing to work with
  '08-minimal.txt': ['Alex Kim', 'Looking for a job.']
}

// Edge case: a very long CV (about 10,000 characters)
function veryLongCv() {
  const lines = [
    'Jordan Lee', 'Vancouver, BC | jordan.lee@email.com', '',
    'SUMMARY', 'Full stack developer with experience across many small projects.', '',
    'SKILLS', 'JavaScript, TypeScript, React, Node.js, PostgreSQL, Git, AWS', '', 'PROJECTS'
  ]
  const topics = ['inventory tracker', 'chat app', 'budget planner', 'event booking site', 'fitness log', 'quiz game',
    'note taking app', 'photo gallery', 'URL shortener', 'markdown editor', 'todo list', 'calendar app',
    'music playlist manager', 'expense splitter', 'habit tracker', 'blog engine', 'job board', 'recipe manager',
    'movie ratings site', 'weather dashboard']
  for (let i = 0; i < 60; i++) {
    const version = Math.floor(i / topics.length) + 1
    lines.push(`Project ${i + 1} - ${topics[i % topics.length]} version ${version}: built with React and Node.js, stored data in PostgreSQL, deployed on AWS, and wrote a short README explaining how to run it locally.`)
  }
  return lines
}

// Edge case: a one-page PDF that is only an image, like a scanned CV, so it has no text to read
function scannedPdf() {
  const pixels = Buffer.alloc(64, 0x80) // an 8x8 grey image
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>',
    { dict: '<< /Type /XObject /Subtype /Image /Width 8 /Height 8 /ColorSpace /DeviceGray /BitsPerComponent 8', data: pixels },
    { dict: '<<', data: Buffer.from('q 612 0 0 792 0 0 cm /Im1 Do Q', 'latin1') }
  ]
  const parts = [Buffer.from('%PDF-1.4\n', 'latin1')]
  const offsets = []
  let length = parts[0].length
  objects.forEach((obj, i) => {
    offsets.push(length)
    const chunk = typeof obj === 'string'
      ? Buffer.from(`${i + 1} 0 obj\n${obj}\nendobj\n`, 'latin1')
      : Buffer.concat([
        Buffer.from(`${i + 1} 0 obj\n${obj.dict} /Length ${obj.data.length} >>\nstream\n`, 'latin1'),
        obj.data,
        Buffer.from('\nendstream\nendobj\n', 'latin1')
      ])
    parts.push(chunk)
    length += chunk.length
  })
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`
  parts.push(Buffer.from(xref, 'latin1'))
  return Buffer.concat(parts)
}

const JOBS = [
  { _id: 'job-java', title: 'Java Backend Developer', company: 'Harbour Systems', category: 'Software', type: 'full-time', location: 'Montreal', requirements: 'Java, Spring Boot, SQL, Git', description: 'Build and test REST APIs for our banking platform.' },
  { _id: 'job-react', title: 'Frontend React Developer', company: 'Cedar Apps', category: 'Software', type: 'full-time', location: 'Vancouver', requirements: 'React, JavaScript, CSS, Figma', description: 'Build responsive pages for our web app.' },
  { _id: 'job-data', title: 'Junior Data Analyst', company: 'Summit Bank', category: 'Data', type: 'full-time', location: 'Toronto', requirements: 'SQL, Python, Excel, Tableau', description: 'Turn banking data into dashboards and weekly reports.' },
  { _id: 'job-devops', title: 'DevOps Engineer', company: 'Cloudnine', category: 'Software', type: 'full-time', location: 'Vancouver', requirements: 'Docker, Kubernetes, AWS, Linux', description: 'Run and automate our cloud infrastructure.' },
  { _id: 'job-fullstack', title: 'Junior Full Stack Developer', company: 'Maple Tech', category: 'Software', type: 'internship', location: 'Montreal', requirements: 'React, Node.js, SQL, REST APIs', description: 'Build features across our web app and backend.' },
  { _id: 'job-cook', title: 'Line Cook', company: 'Trattoria Roma', category: 'Other', type: 'full-time', location: 'Montreal', requirements: 'Food safety certification, 2 years of kitchen experience', description: 'Prepare dishes during busy dinner service.' },
  { _id: 'job-retail', title: 'Retail Store Associate', company: 'Riverside Retail', category: 'Other', type: 'part-time', location: 'Montreal', requirements: 'Customer service, cash handling', description: 'Help customers and keep the store organised.' },
  { _id: 'job-marketing', title: 'Marketing Coordinator', company: 'Coastline Apparel', category: 'Marketing', type: 'full-time', location: 'Vancouver', requirements: 'Social media, copywriting, Canva', description: 'Plan and run our social media campaigns.' }
]

fs.mkdirSync(CV_DIR, { recursive: true })
for (const [file, lines] of Object.entries(CVS)) fs.writeFileSync(path.join(CV_DIR, file), lines.join('\n') + '\n')
fs.writeFileSync(path.join(CV_DIR, '07-very-long.txt'), veryLongCv().join('\n') + '\n')
fs.writeFileSync(path.join(CV_DIR, '09-scanned-image-only.pdf'), scannedPdf())
fs.writeFileSync(path.join(CV_DIR, '10-empty.txt'), '') // Edge case: an empty file
fs.writeFileSync(path.join(FIXTURES, 'jobs.json'), JSON.stringify(JOBS, null, 2) + '\n')
console.log(`Created 10 test CVs in ${CV_DIR} and 8 jobs in ${path.join(FIXTURES, 'jobs.json')}`)