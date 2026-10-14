import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

// Server-side only: the API key is read from ANTHROPIC_API_KEY and never sent to the browser.
// Used by the Vite dev server (vite.config.js) and the Vercel function (api/chat.js).

const MODEL = 'claude-opus-5-5'
const MAX_HISTORY = 20
const MAX_MESSAGE_CHARS = 4000
const MAX_CONTEXT_CHARS = 2000

const SYSTEM_PROMPT = `You are "eTMS Assistant", the in-app help assistant for eTMS, an employee transport management system used by transport vendors and corporate admins.

What eTMS covers:
- Routes: daily pick-up (PICK) and drop (DROP) trips per shift time. A route is allocated to a vehicle/driver, the driver accepts it, the trip starts, then completes. Routes can be refused by the driver, rejected, or not started.
- Vendor Dashboard: route counts (Total, Allocated, Driver Refused, Started, Completed, Rejected), Status (guards and medical cases on trips), Attention alerts (e.g. cab reached, driver late, guard not assigned), and a shift-wise routes table with search, trip-type filter, refresh, CSV download and per-route edit.
- Other modules in the sidebar: Route Details (Today Routes, Route History), Clear Geofencing, Reassign, Add Employee, Transport (Tracking Employees, Reports Data), Vendor (Dashboard, Add Employee, Assign Vehicle), Reports.
- The header has a date picker, a location (site) selector, notifications and the profile menu.

How to answer:
- Help the user solve their problem: explain what screens and numbers mean, give step-by-step instructions in the app, and suggest practical fixes for operational issues (refused routes, late drivers, missing guards, geofencing problems, reassigning vehicles).
- Be concise and practical. Use short numbered steps for procedures. Reply in the user's language; if they write in Hinglish, reply in simple Hinglish.
- You cannot see live data or take actions in the system. Use the page context you are given; if something depends on data you don't have, say what to check and where.
- If a request needs an admin, the transport desk or the support team (for example account access or billing disputes), say so and suggest "GET IN TOUCH" in the sidebar.
- Don't invent features, phone numbers or policies that aren't described here.`

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 200_000) throw new Error('Request too large')
  }
  return raw ? JSON.parse(raw) : {}
}

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return null
  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift()
  return cleaned.length && cleaned[cleaned.length - 1].role === 'user' ? cleaned : null
}

// The SDK resolves credentials from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or an `ant auth login` profile.
const hasCredentials = () => Boolean(
  process.env.ANTHROPIC_API_KEY
  || process.env.ANTHROPIC_AUTH_TOKEN
  || process.env.ANTHROPIC_PROFILE
  || existsSync(join(homedir(), '.config', 'anthropic')),
)

const NOT_CONFIGURED = { code: 'not_configured', error: 'AI is not configured on the server (add ANTHROPIC_API_KEY).' }

let client
const getClient = () => (client ??= new Anthropic())

// Streams the assistant reply back as plain text chunks.
export default async function chatHandler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!hasCredentials()) return json(res, 503, NOT_CONFIGURED)

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { error: 'Invalid request body' })
  }

  const messages = sanitizeMessages(body.messages)
  if (!messages) return json(res, 400, { error: 'Send at least one user message.' })
  const pageContext = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_CHARS) : ''

  const system = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]
  if (pageContext) system.push({ type: 'text', text: `Current page context:\n${pageContext}` })

  const abort = new AbortController()
  res.on('close', () => { if (!res.writableEnded) abort.abort() })

  try {
    const stream = getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      // Re-run on Anthropic's recommended model if a safety classifier declines.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
    }, { signal: abort.signal })

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') res.write(event.delta.text)
    }

    const final = await stream.finalMessage()
    if (final.stop_reason === 'refusal') res.write('\n\nSorry, I can’t help with that request. Please contact the support team.')
    else if (final.stop_reason === 'max_tokens') res.write('\n\n(Reply was cut short. Ask me to continue.)')
    res.end()
  } catch (error) {
    if (abort.signal.aborted) return
    if (error instanceof Anthropic.AuthenticationError && !res.headersSent) {
      console.error('Claude API key is invalid or revoked.')
      return json(res, 503, { ...NOT_CONFIGURED, error: 'The AI API key on the server is invalid.' })
    }
    let message = 'The assistant is unavailable right now. Please try again.'
    if (error instanceof Anthropic.RateLimitError) message = 'Too many requests right now. Please wait a moment and try again.'
    else if (error instanceof Anthropic.APIError) console.error(`Claude API error ${error.status}:`, error.message)
    else console.error('Chat handler error:', error)

    if (!res.headersSent) return json(res, 502, { error: message })
    res.end(`\n\n${message}`)
  }
}
