const fs = require('fs/promises')
const path = require('path')
const { PDFParse } = require('pdf-parse')
const mammoth = require('mammoth')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// Task 33.2: reads the text out of a CV file.
// Returns '' when no text can be read (old .doc files, or scanned PDFs that are only images).
async function extractTextFromFile(filePath) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.pdf') {
    const parser = new PDFParse({ data: await fs.readFile(filePath) })
    try {
      // pageJoiner '' stops pdf-parse adding '-- 1 of 1 --' markers, which made scanned CVs look like they had text
      const result = await parser.getText({ pageJoiner: '' })
      return result.text.trim()
    } finally {
      await parser.destroy()
    }
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value.trim()
  }

  return ''
}

// Reads the text out of a CV uploaded by a user
async function extractResumeText(filename) {
  // basename() keeps the path inside the uploads folder
  return extractTextFromFile(path.join(UPLOADS_DIR, path.basename(filename)))
}

module.exports = { extractResumeText, extractTextFromFile }