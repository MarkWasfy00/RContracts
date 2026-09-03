import { randomUUID } from 'node:crypto'
import express, { Router } from 'express'

import { authEnabled, requireAdmin } from './auth.js'
import {
  UPLOAD_DIR,
  describeUpload,
  listMedia,
  removeMedia,
  uploadMedia,
} from './media.js'
import {
  addProject,
  getSettings,
  listProjects,
  removeProject,
  replaceProject,
  resetAll,
  saveSettings,
} from './store.js'
import { ValidationError, parseProject, parseSettings } from './validate.js'

export const api = Router()

api.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── Auth ──────────────────────────────────────────────────────────

// Lets /admin know whether to show its login screen at all. A server running
// without ADMIN_TOKEN (local development) has nothing to log into.
api.get('/auth', (_req, res) => {
  res.json({ required: authEnabled })
})

// Checks a key without writing anything, so the login screen can tell a
// wrong key from a working one. requireAdmin answers 401 on a bad key.
api.post('/auth/verify', requireAdmin, (_req, res) => {
  res.status(204).end()
})

// ── Projects ──────────────────────────────────────────────────────

api.get('/projects', (_req, res) => {
  res.json(listProjects())
})

api.post('/projects', requireAdmin, async (req, res) => {
  const project = { ...parseProject(req.body), id: randomUUID() }
  await addProject(project)
  res.status(201).json(project)
})

api.put('/projects/:id', requireAdmin, async (req, res) => {
  const updated = await replaceProject(req.params.id, parseProject(req.body))
  res.json(updated)
})

api.delete('/projects/:id', requireAdmin, async (req, res) => {
  await removeProject(req.params.id)
  res.status(204).end()
})

// ── Settings ──────────────────────────────────────────────────────

api.get('/settings', (_req, res) => {
  res.json(getSettings())
})

api.put('/settings', requireAdmin, async (req, res) => {
  const settings = await saveSettings(parseSettings(req.body, getSettings()))
  res.json(settings)
})

// ── Media ─────────────────────────────────────────────────────────

// The library behind the admin page's media picker. Admin-only: the files
// themselves are public, but which ones exist is not the site's business.
api.get('/media', requireAdmin, async (_req, res) => {
  res.json(await listMedia())
})

// Accepts one image or video from the admin page and answers with the URL
// to store on the project or setting being edited.
api.post('/media', requireAdmin, uploadMedia, (req, res) => {
  if (!req.file) throw new ValidationError('لم يتم إرسال أي ملف')
  res.status(201).json(describeUpload(req.file))
})

api.delete('/media/:name', requireAdmin, async (req, res) => {
  await removeMedia(req.params.name)
  res.status(204).end()
})

// Serving the uploads. Mounted under /api so the Vite dev proxy carries
// them too, which keeps one stored URL working in development and in
// production. Names are UUIDs, so a URL's content never changes.
api.use(
  '/media',
  express.static(UPLOAD_DIR, {
    index: false,
    maxAge: '365d',
    immutable: true,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
)

// ── Maintenance ───────────────────────────────────────────────────

api.post('/reset', requireAdmin, async (_req, res) => {
  const fresh = await resetAll()
  res.json(fresh)
})
