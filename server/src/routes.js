import { randomUUID } from 'node:crypto'
import { Router } from 'express'

import { requireAdmin } from './auth.js'
import {
  addProject,
  getSettings,
  listProjects,
  removeProject,
  replaceProject,
  resetAll,
  saveSettings,
} from './store.js'
import { parseProject, parseSettings } from './validate.js'

export const api = Router()

api.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
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

// ── Maintenance ───────────────────────────────────────────────────

api.post('/reset', requireAdmin, async (_req, res) => {
  const fresh = await resetAll()
  res.json(fresh)
})
