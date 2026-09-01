import { defaultSettings, projectCategories } from './defaults.js'

/** Thrown when a request body doesn't match the expected shape. */
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const MAX_TEXT = 2000
const MAX_TAGS = 12

function requireString(value, field, { max = MAX_TEXT, allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    throw new ValidationError(`"${field}" must be a string`)
  }
  const trimmed = value.trim()
  if (!allowEmpty && !trimmed) {
    throw new ValidationError(`"${field}" is required`)
  }
  if (trimmed.length > max) {
    throw new ValidationError(`"${field}" must be at most ${max} characters`)
  }
  return trimmed
}

function optionalString(value, field, fallback, options) {
  if (value === undefined || value === null) return fallback
  return requireString(value, field, { allowEmpty: true, ...options })
}

/**
 * Normalise a project payload from the client. Returns a clean object with
 * only the fields we store — anything extra the client sent is dropped.
 */
export function parseProject(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object')
  }

  const category = requireString(body.category, 'category')
  if (!projectCategories.includes(category)) {
    throw new ValidationError(
      `"category" must be one of: ${projectCategories.join(', ')}`,
    )
  }

  let tags = []
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      throw new ValidationError('"tags" must be an array of strings')
    }
    tags = body.tags
      .map((tag, index) => requireString(tag, `tags[${index}]`, { max: 60 }))
      .filter(Boolean)
      .slice(0, MAX_TAGS)
  }

  return {
    title: requireString(body.title, 'title', { max: 200 }),
    description: requireString(body.description, 'description'),
    image: requireString(body.image, 'image', { max: 500 }),
    category,
    tags,
  }
}

/**
 * Normalise a settings payload. Unknown keys are dropped and missing keys
 * fall back to the current stored value, so a partial update is safe.
 */
export function parseSettings(body, current = defaultSettings) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object')
  }

  const textFields = [
    'phone',
    'phoneDisplay',
    'whatsapp',
    'instagramUrl',
    'instagramHandle',
    'heroBadge',
    'heroTitle',
    'heroHighlight',
    'heroSubtitle',
    'heroImage',
    'aboutTitle',
    'aboutHighlight',
    'aboutText',
    'aboutImage',
    'founderName',
    'founderRole',
    'workScope',
  ]

  const result = {}
  for (const field of textFields) {
    result[field] = optionalString(body[field], field, current[field])
  }

  if (body.stats === undefined) {
    result.stats = current.stats
  } else {
    if (!Array.isArray(body.stats)) {
      throw new ValidationError('"stats" must be an array')
    }
    result.stats = body.stats.slice(0, 6).map((stat, index) => {
      if (!stat || typeof stat !== 'object') {
        throw new ValidationError(`"stats[${index}]" must be an object`)
      }
      return {
        value: optionalString(stat.value, `stats[${index}].value`, '', {
          max: 40,
        }),
        label: optionalString(stat.label, `stats[${index}].label`, '', {
          max: 80,
        }),
      }
    })
  }

  if (body.aboutPoints === undefined) {
    result.aboutPoints = current.aboutPoints
  } else {
    if (!Array.isArray(body.aboutPoints)) {
      throw new ValidationError('"aboutPoints" must be an array of strings')
    }
    result.aboutPoints = body.aboutPoints
      .map((point, index) =>
        requireString(point, `aboutPoints[${index}]`, {
          max: 300,
          allowEmpty: true,
        }),
      )
      .filter(Boolean)
      .slice(0, 20)
  }

  return result
}
