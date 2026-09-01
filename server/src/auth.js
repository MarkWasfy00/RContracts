import { timingSafeEqual } from 'node:crypto'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim() || null

export const authEnabled = ADMIN_TOKEN !== null

function tokenMatches(candidate) {
  const a = Buffer.from(candidate)
  const b = Buffer.from(ADMIN_TOKEN)
  // timingSafeEqual throws on length mismatch, so check that first.
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Guards write endpoints. Reads stay public — the site itself needs them.
 *
 * With ADMIN_TOKEN unset the guard is a no-op, which is fine for local
 * development but must not be how this runs in production.
 */
export function requireAdmin(req, res, next) {
  if (!authEnabled) return next()

  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  if (!token || !tokenMatches(token)) {
    return res.status(401).json({ error: 'مفتاح الإدارة غير صحيح' })
  }
  return next()
}
