import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { defaultProjects, defaultSettings } from './defaults.js'

export const DATA_DIR = resolve(
  process.env.DATA_DIR ?? join(process.cwd(), 'data'),
)
const DB_FILE = join(DATA_DIR, 'db.json')

/** In-memory copy of the database — the file is written from this. */
let db = null

/**
 * Writes are serialised through this chain so two concurrent requests
 * can't interleave a read-modify-write and lose one of the changes.
 */
let writeChain = Promise.resolve()

function seed() {
  return {
    projects: structuredClone(defaultProjects),
    settings: structuredClone(defaultSettings),
  }
}

async function persist() {
  await mkdir(dirname(DB_FILE), { recursive: true })
  // Write to a temp file and rename, so a crash mid-write can't leave a
  // truncated db.json behind.
  const tmp = `${DB_FILE}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(db, null, 2), 'utf8')
  await rename(tmp, DB_FILE)
}

/** Load the database from disk, seeding it on first run. */
export async function initStore() {
  try {
    const raw = await readFile(DB_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    db = {
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : structuredClone(defaultProjects),
      // Spread over defaults so a database written before a new setting
      // was added still resolves that setting to a usable value.
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    }
    return { seeded: false, file: DB_FILE }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    db = seed()
    await persist()
    return { seeded: true, file: DB_FILE }
  }
}

/**
 * Run a mutation against the database with exclusive access, then save.
 * `mutate` receives the live db object and returns whatever the caller needs.
 */
function withWriteLock(mutate) {
  const result = writeChain.then(async () => {
    const value = await mutate(db)
    await persist()
    return value
  })
  // Keep the chain alive regardless of whether this mutation failed.
  writeChain = result.then(
    () => {},
    () => {},
  )
  return result
}

/** Thrown by store mutations when the target row doesn't exist. */
export class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// ── Projects ──────────────────────────────────────────────────────

export function listProjects() {
  return db.projects
}

export function getProject(id) {
  return db.projects.find((p) => p.id === id) ?? null
}

export function addProject(project) {
  return withWriteLock((data) => {
    data.projects.push(project)
    return project
  })
}

export function replaceProject(id, project) {
  return withWriteLock((data) => {
    const index = data.projects.findIndex((p) => p.id === id)
    if (index === -1) throw new NotFoundError(`No project with id "${id}"`)
    const updated = { ...project, id }
    data.projects[index] = updated
    return updated
  })
}

export function removeProject(id) {
  return withWriteLock((data) => {
    const index = data.projects.findIndex((p) => p.id === id)
    if (index === -1) throw new NotFoundError(`No project with id "${id}"`)
    data.projects.splice(index, 1)
  })
}

// ── Settings ──────────────────────────────────────────────────────

export function getSettings() {
  return db.settings
}

export function saveSettings(settings) {
  return withWriteLock((data) => {
    data.settings = { ...data.settings, ...settings }
    return data.settings
  })
}

// ── Maintenance ───────────────────────────────────────────────────

export function resetAll() {
  return withWriteLock((data) => {
    const fresh = seed()
    data.projects = fresh.projects
    data.settings = fresh.settings
    return fresh
  })
}
