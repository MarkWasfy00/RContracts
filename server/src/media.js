import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { readdir, stat, unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'

import multer from 'multer'

import { DATA_DIR, NotFoundError } from './store.js'
import { ValidationError } from './validate.js'

/**
 * Uploaded images and videos live next to db.json so a single persisted
 * directory (the Docker volume) holds the whole site's content.
 */
export const UPLOAD_DIR = join(DATA_DIR, 'uploads')

/** Biggest file the admin may upload. Videos are the reason it is this high. */
const DEFAULT_MAX_MB = 200

/**
 * The limit in whole bytes.
 *
 * Multer hands this straight to busboy, which compares byte counts against
 * it. A fractional limit makes it truncate the upload and report success
 * instead of rejecting it, so the value is rounded; anything unusable
 * (a typo, zero, a negative) falls back to the default rather than
 * silently becoming no limit at all.
 */
const configuredMb = Number(process.env.MAX_UPLOAD_MB)
const MAX_UPLOAD_BYTES = Math.round(
  (Number.isFinite(configuredMb) && configuredMb > 0
    ? configuredMb
    : DEFAULT_MAX_MB) *
    1024 *
    1024,
)

/**
 * Extension per accepted MIME type. The extension is taken from this table
 * rather than from the uploaded filename, so nothing the client sends ever
 * decides what the stored file is called.
 */
const ACCEPTED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

/** `.mov` files often arrive as this instead of video/quicktime. */
const MIME_ALIASES = {
  'video/x-quicktime': 'video/quicktime',
  'image/jpg': 'image/jpeg',
}

function normaliseMime(type) {
  const base = String(type ?? '').split(';')[0].trim().toLowerCase()
  return MIME_ALIASES[base] ?? base
}

/** Files we generated: a UUID plus one of the extensions above. */
const STORED_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i

function mediaKind(mime) {
  return normaliseMime(mime).startsWith('video/') ? 'video' : 'image'
}

/** Public URL for a stored file. Served through /api so Vite proxies it too. */
function mediaUrl(filename) {
  return `/api/media/${filename}`
}

// multer needs the directory to exist before the first request lands.
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${randomUUID()}${ACCEPTED[normaliseMime(file.mimetype)]}`),
})

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED[normaliseMime(file.mimetype)]) {
      return cb(
        new ValidationError(
          `نوع الملف غير مدعوم (${file.mimetype}). المسموح: صور JPG/PNG/WebP/AVIF/GIF أو فيديو MP4/WebM/MOV`,
        ),
      )
    }
    return cb(null, true)
  },
}).single('file')

/** Description of an uploaded file, as returned to the admin page. */
function describe(filename, size, modified) {
  const ext = extname(filename).toLowerCase()
  const mime =
    Object.keys(ACCEPTED).find((type) => ACCEPTED[type] === ext) ?? ''
  return {
    name: filename,
    url: mediaUrl(filename),
    kind: mediaKind(mime),
    type: mime,
    size,
    modified,
  }
}

export function describeUpload(file) {
  return describe(file.filename, file.size, new Date().toISOString())
}

/** Newest first, so the admin's media library shows recent uploads on top. */
export async function listMedia() {
  let names
  try {
    names = await readdir(UPLOAD_DIR)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  const files = await Promise.all(
    names.filter(isStoredName).map(async (name) => {
      const info = await stat(join(UPLOAD_DIR, name))
      return describe(name, info.size, info.mtime.toISOString())
    }),
  )
  return files.sort((a, b) => b.modified.localeCompare(a.modified))
}

/**
 * Guards against `..`, path separators, and any other name we did not
 * generate ourselves — the pattern allows only hex digits, dashes, and one
 * dot before the extension.
 */
function isStoredName(name) {
  return STORED_NAME.test(name)
}

export async function removeMedia(filename) {
  if (!isStoredName(filename)) {
    throw new ValidationError('اسم ملف غير صالح')
  }
  try {
    await unlink(join(UPLOAD_DIR, filename))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    throw new NotFoundError(`No uploaded file named "${filename}"`)
  }
}
