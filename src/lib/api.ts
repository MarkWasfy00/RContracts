import type { Project, SiteSettings } from './site-data'

/**
 * Client for the Express API in ./server.
 *
 * In development Vite proxies /api to http://localhost:4000 (see
 * vite.config.ts). In production the same server hosts the built site, so
 * the relative path works there too. Set VITE_API_BASE to point somewhere
 * else (e.g. an API on another domain).
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

const ADMIN_TOKEN_KEY = 'rg-admin-token'

/** The admin key is only needed when the server runs with ADMIN_TOKEN set. */
export function getAdminToken(): string {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAdminToken(token: string) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch {
    /* storage unavailable — requests just go out unauthenticated */
  }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')

  const token = getAdminToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('تعذر الاتصال بالخادم. تأكد إن الـ API شغال.', 0)
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    /* server returned something that isn't JSON */
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `فشل الطلب (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

// ── Projects ──────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Array<Project>> {
  return (await request<Array<Project>>('/projects')) ?? []
}

export async function createProject(
  input: Omit<Project, 'id'>,
): Promise<Project> {
  return (await request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  }))!
}

export async function updateProject(project: Project): Promise<Project> {
  const { id, ...rest } = project
  return (await request<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(rest),
  }))!
}

export async function deleteProject(id: string): Promise<void> {
  await request<void>(`/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ── Site settings ─────────────────────────────────────────────────

export async function fetchSettings(): Promise<SiteSettings> {
  return (await request<SiteSettings>('/settings'))!
}

export async function updateSettings(
  settings: SiteSettings,
): Promise<SiteSettings> {
  return (await request<SiteSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }))!
}

// ── Maintenance ───────────────────────────────────────────────────

/** Restore the projects and settings that ship as defaults on the server. */
export async function resetAllContent(): Promise<void> {
  await request<void>('/reset', { method: 'POST' })
}
