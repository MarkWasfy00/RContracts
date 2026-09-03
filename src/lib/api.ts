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

  // The login screen sets this itself to test a key it hasn't stored yet.
  if (!headers.has('Authorization')) {
    const token = getAdminToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

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

// ── Auth ──────────────────────────────────────────────────────────

/**
 * Whether the server was started with ADMIN_TOKEN set. When it wasn't, there
 * is no key to check and /admin skips its login screen.
 */
export async function fetchAuthRequired(): Promise<boolean> {
  const result = await request<{ required: boolean }>('/auth')
  return result?.required ?? false
}

/** Throws ApiError(401) when the key is wrong. Stores nothing. */
export async function verifyAdminToken(token: string): Promise<void> {
  await request<void>('/auth/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
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

// ── Media library ─────────────────────────────────────────────────

/** One image or video uploaded through the admin page. */
export interface MediaFile {
  /** Stored filename — also the id used to delete it. */
  name: string
  /** Path to use as a project image or a settings image. */
  url: string
  kind: 'image' | 'video'
  type: string
  size: number
  /** ISO timestamp. */
  modified: string
}

/** What the server accepts, for a file input's `accept` attribute. */
export const mediaAccept = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
].join(',')

/**
 * Uploads one file and resolves with its stored URL.
 *
 * This is the one request that doesn't go through `request()`: fetch cannot
 * report upload progress, and a video takes long enough that the admin needs
 * a progress bar rather than a spinner.
 */
export function uploadMedia(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/media`)

    const token = getAdminToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      let payload: unknown = null
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        /* server returned something that isn't JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve(payload as MediaFile)
      }
      const message =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: unknown }).error)
          : `فشل رفع الملف (${xhr.status})`
      reject(new ApiError(message, xhr.status))
    })

    xhr.addEventListener('error', () =>
      reject(new ApiError('تعذر الاتصال بالخادم أثناء الرفع.', 0)),
    )
    xhr.addEventListener('abort', () =>
      reject(new ApiError('تم إلغاء الرفع.', 0)),
    )

    xhr.send(body)
  })
}

/** Everything uploaded so far, newest first. Requires the admin key. */
export async function fetchMediaLibrary(): Promise<Array<MediaFile>> {
  return (await request<Array<MediaFile>>('/media')) ?? []
}

export async function deleteMedia(name: string): Promise<void> {
  await request<void>(`/media/${encodeURIComponent(name)}`, {
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
