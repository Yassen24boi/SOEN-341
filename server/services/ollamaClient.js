// Shared helper for talking to the free local AI run by Ollama (https://ollama.com).
// Ollama must be running on the same computer as the server, with the model downloaded.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'
const TIMEOUT_MS = 30000

// Sends one chat request to Ollama and returns the text of its answer.
// `schema` is the JSON shape the answer must follow. Tests replace this function with a fake.
async function askOllama(systemPrompt, userMessage, schema) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: schema,
      options: {
        // Low temperature keeps answers focused and consistent
        temperature: 0.2,
        // Room for a full CV plus a list of jobs. Without this, Ollama may quietly cut long prompts.
        num_ctx: 16384
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    }),
    // Give up after 30 seconds
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (!res.ok) {
    throw new Error(`Ollama returned status ${res.status}`)
  }
  const data = await res.json()
  return data.message?.content || ''
}

module.exports = { askOllama }
