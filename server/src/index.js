import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'

import { authEnabled } from './auth.js'
import { api } from './routes.js'
import { NotFoundError, initStore } from './store.js'
import { ValidationError } from './validate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT ?? 4000)
const CLIENT_DIST = resolve(
  process.env.CLIENT_DIST ?? join(__dirname, '..', '..', 'dist'),
)
// Comma-separated list, or "*" to allow any origin.
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((o) => o.trim()),
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use((req, _res, next) => {
  if (req.method !== 'GET') {
    console.log(`${req.method} ${req.originalUrl}`)
  }
  next()
})

app.use('/api', api)

// Serve the built site when it exists, so one process can host everything.
// In development Vite serves the frontend and proxies /api here instead.
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  // SPA fallback: any non-API GET that didn't match a file gets index.html.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    res.sendFile(join(CLIENT_DIST, 'index.html'))
  })
}

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` })
})

// eslint-disable-next-line no-unused-vars -- Express identifies error
// handlers by arity, so `next` must stay in the signature.
app.use((error, _req, res, _next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message })
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message })
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Malformed JSON body' })
  }
  console.error(error)
  return res.status(500).json({ error: 'Internal server error' })
})

const { seeded, file } = await initStore()

app.listen(PORT, () => {
  console.log(`RG API listening on http://localhost:${PORT}`)
  console.log(`  database: ${file}${seeded ? ' (seeded with defaults)' : ''}`)
  console.log(`  CORS origin: ${CORS_ORIGIN}`)
  if (existsSync(CLIENT_DIST)) {
    console.log(`  serving site from: ${CLIENT_DIST}`)
  }
  if (!authEnabled) {
    console.warn(
      '  WARNING: ADMIN_TOKEN is not set — write endpoints are unprotected.',
    )
  }
})
