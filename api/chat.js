// Vercel serverless function: POST /api/chat
import chatHandler from '../server/chatHandler.js'

export const config = { maxDuration: 60 }

export default chatHandler
