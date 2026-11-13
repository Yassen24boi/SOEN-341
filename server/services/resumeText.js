const fs = require('fs/promises')
const path = require('path')
const { PDFParse } = require('pdf-parse')
const mammoth = require('mammoth')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// Task 33.2: reads the text out of an uploaded CV.
// Returns '' when no text can be read (old .doc files, or scanned PDFs that are only images).
async function extractResumeText(filename) {
  // basename() keeps the path inside the uploads folder
  const filePath = path.join(UPLOADS_DIR, path.basename(filename))
  const extension = path.extname(filename).toLowerCase()

  if (extension === '.pdf') {
    const parser = new PDFParse({ data: await fs.readFile(filePath) })
    try {
      const result = await parser.getText()
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

module.exports = { extractResumeText }
