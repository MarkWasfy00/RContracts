/**
 * A project's files: the gallery (`media`) and the one shown in grids and
 * shared links (`cover`).
 *
 * Projects used to hold a single `image`, so everything here also accepts
 * that older shape — a database written before this change, and any client
 * still sending it, both keep working.
 */

const VIDEO_PATH = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i

/** Most files one project may hold. */
export const MAX_MEDIA = 30

export function isVideoPath(path) {
  return VIDEO_PATH.test(String(path ?? '').trim())
}

/**
 * The cover to use when the admin didn't choose one: the first still image,
 * falling back to the first file of any kind. An image is preferred because
 * a video frame is what a card and a shared link can't render on their own.
 */
export function defaultCover(media) {
  return media.find((item) => !isVideoPath(item)) ?? media[0] ?? ''
}

/** Drop blanks and duplicates, keeping the order the admin arranged. */
export function cleanMediaList(media) {
  const seen = new Set()
  const result = []
  for (const item of media) {
    const trimmed = String(item ?? '').trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
    if (result.length === MAX_MEDIA) break
  }
  return result
}

/**
 * A stored project in the current shape. Used when reading the database, so
 * rows saved before projects could hold more than one file are migrated on
 * load rather than checked for at every place that renders them.
 */
export function normaliseProject(project) {
  if (!project || typeof project !== 'object') return null

  const media = cleanMediaList(
    Array.isArray(project.media) ? project.media : [],
  )
  // The old single-image field is the gallery when there is no gallery yet.
  const legacy = String(project.image ?? '').trim()
  if (!media.length && legacy) media.push(legacy)

  const cover = String(project.cover ?? '').trim() || defaultCover(media)

  const { image: _legacyImage, ...rest } = project
  return { ...rest, media, cover }
}
