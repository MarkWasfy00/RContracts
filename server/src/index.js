import { existsSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'
import { MulterError } from 'multer'

import { authEnabled } from './auth.js'
import { UPLOAD_DIR } from './media.js'
import {
  metaForPath,
  renderPage,
  renderRobotsTxt,
  renderSitemap,
  siteOrigin,
} from './seo.js'
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
// The site runs behind a reverse proxy in production, so X-Forwarded-Proto
// is what tells the SEO head whether to build https:// URLs. Set SITE_URL to
// pin the canonical origin outright and take the header out of the picture.
app.set('trust proxy', true)
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

/**
 * Whether this request is a browser navigating to a page, as opposed to
 * fetching a script, stylesheet, or image.
 *
 * A miss for an asset has to be a real 404: answering it with index.html
 * hands the browser HTML where it expected JavaScript, and the app renders
 * as a blank page with no obvious cause.
 */
function wantsPage(req) {
  const dest = req.get('sec-fetch-dest')
  if (dest) return dest === 'document'
  // Older clients don't send that header; a page URL has no file extension.
  return !extname(req.path)
}

// Serve the built site when it exists, so one process can host everything.
// In development Vite serves the frontend and proxies /api here instead.
if (existsSync(CLIENT_DIST)) {
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(renderRobotsTxt(siteOrigin(req)))
  })

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(renderSitemap(siteOrigin(req)))
  })

  // `index: false` so "/" falls through to the SPA handler below — served
  // straight from disk it would skip the per-URL metadata.
  app.use(express.static(CLIENT_DIST, { index: false }))

  // SPA fallback: any non-API GET for a page that didn't match a file gets
  // index.html, with the head rendered for that URL so crawlers and link
  // previews see the right title, description, and image.
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    if (!wantsPage(req)) return next()

    const base = siteOrigin(req)
    const meta = metaForPath(req.path, base)

    // A project URL with no project behind it. The app still renders and
    // explains itself, but the status says plainly that it isn't a page.
    if (meta === null) {
      const missing = metaForPath('/not-found', base)
      return res.status(404).send(await renderPage(CLIENT_DIST, missing))
    }

    res.send(await renderPage(CLIENT_DIST, meta))
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
  if (error instanceof MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'الملف أكبر من الحد المسموح'
        : 'تعذر رفع الملف'
    return res.status(400).json({ error: message })
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
  console.log(`  uploads:  ${UPLOAD_DIR}`)
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
