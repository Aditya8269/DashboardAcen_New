import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import chatHandler from './server/chatHandler.js'

// Serves POST /api/chat during `npm run dev` (on Vercel, api/chat.js handles it).
const chatApiPlugin = () => ({
  name: 'etms-chat-api',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res) => chatHandler(req, res))
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/chat', (req, res) => chatHandler(req, res))
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  // Server-only secret: loaded for the dev middleware, never exposed to client code.
  const serverEnv = loadEnv(mode, '.', 'ANTHROPIC_')
  if (serverEnv.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = serverEnv.ANTHROPIC_API_KEY

  return {
    plugins: [react(), chatApiPlugin()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  }
})
