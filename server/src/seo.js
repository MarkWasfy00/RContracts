import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { getSettings, listProjects } from './store.js'

/**
 * Server-rendered page metadata.
 *
 * The site is a single-page app, so the browser builds every page from
 * JavaScript. Search crawlers mostly cope with that, but the scrapers behind
 * WhatsApp, Facebook, and X do not run any — a link shared in a chat gets
 * whatever is in the HTML as it leaves the server. So the head is rendered
 * here, per URL, before index.html is sent.
 *
 * The client only keeps the tab title in step after that (src/lib/seo.ts);
 * everything crawler-facing is decided in this file.
 */

const SITE_NAME = 'RG General Contracts'
const DEFAULT_TITLE = 'RG General Contracts | مقاولات عامة وتشطيبات'

/**
 * Canonical origin, e.g. "https://rggeneralcontracts.com". Without it the
 * request's own host is used, which is right in development and behind a
 * correctly configured proxy, but set it in production so canonical and
 * Open Graph URLs can't vary by how the site was reached.
 */
const SITE_URL = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '')

export function siteOrigin(req) {
  if (SITE_URL) return SITE_URL
  return `${req.protocol}://${req.get('host')}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Absolute URL for a stored path. Leaves an external link alone. */
function absolute(base, path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Squeeze body copy into something a search result can show whole. */
function truncate(text, max = 160) {
  const clean = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

const VIDEO_PATH = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i

function isVideo(path) {
  return VIDEO_PATH.test(String(path ?? '').trim())
}

export function projectPath(id) {
  return `/projects/${encodeURIComponent(id)}`
}

/**
 * Metadata for one URL.
 *
 * Returns `null` for a project id that doesn't exist, so the caller can
 * answer 404 instead of letting a dead link look like a real page.
 */
export function metaForPath(pathname, base) {
  const settings = getSettings()
  const siteImage = absolute(base, settings.heroImage)

  const organisation = {
    '@type': 'GeneralContractor',
    '@id': `${base}/#business`,
    name: SITE_NAME,
    description: truncate(settings.aboutText, 300),
    url: `${base}/`,
    image: siteImage,
    logo: absolute(base, '/media/logo.jpg'),
    telephone: `+2${settings.phone}`,
    areaServed: settings.workScope,
    sameAs: [settings.instagramUrl].filter(Boolean),
    founder: {
      '@type': 'Person',
      name: settings.founderName,
      jobTitle: settings.founderRole,
    },
  }

  if (pathname === '/' || pathname === '') {
    const description = truncate(settings.heroSubtitle)
    return {
      title: DEFAULT_TITLE,
      description,
      canonical: `${base}/`,
      image: siteImage,
      type: 'website',
      jsonLd: [
        organisation,
        {
          '@type': 'WebSite',
          '@id': `${base}/#website`,
          name: SITE_NAME,
          url: `${base}/`,
          inLanguage: 'ar',
          publisher: { '@id': `${base}/#business` },
        },
      ],
    }
  }

  const projectMatch = /^\/projects\/([^/]+)\/?$/.exec(pathname)
  if (projectMatch) {
    let id
    try {
      id = decodeURIComponent(projectMatch[1])
    } catch {
      return null // a malformed escape can't match a real project
    }
    const project = listProjects().find((p) => p.id === id)
    if (!project) return null

    const url = `${base}${projectPath(project.id)}`
    const media = absolute(base, project.image)
    const projectIsVideo = isVideo(project.image)

    return {
      title: `${project.title} | ${SITE_NAME}`,
      description: truncate(project.description),
      canonical: url,
      // A video has no still to preview with, so the shared card falls back
      // to the site image and the video is offered alongside it.
      image: projectIsVideo ? siteImage : media,
      video: projectIsVideo ? media : '',
      type: 'article',
      jsonLd: [
        organisation,
        {
          '@type': 'CreativeWork',
          '@id': `${url}#project`,
          name: project.title,
          description: project.description,
          url,
          [projectIsVideo ? 'video' : 'image']: media,
          keywords: project.tags.join(', '),
          creator: { '@id': `${base}/#business` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'الرئيسية',
              item: `${base}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'أعمالنا',
              item: `${base}/#portfolio`,
            },
            { '@type': 'ListItem', position: 3, name: project.title },
          ],
        },
      ],
    }
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return {
      title: `لوحة التحكم | ${SITE_NAME}`,
      description: '',
      canonical: '',
      robots: 'noindex, nofollow',
    }
  }

  return {
    title: DEFAULT_TITLE,
    description: truncate(settings.heroSubtitle),
    canonical: '',
    image: siteImage,
    type: 'website',
    robots: 'noindex',
  }
}

function tag(markup) {
  return `    ${markup}`
}

function renderHead(meta) {
  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="robots" content="${escapeHtml(meta.robots ?? 'index, follow')}" />`,
  ]

  if (meta.description) {
    lines.push(
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    )
  }
  if (meta.canonical) {
    lines.push(
      `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
      `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    )
  }

  lines.push(
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type ?? 'website')}" />`,
    `<meta property="og:locale" content="ar_EG" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  )

  if (meta.image) {
    lines.push(
      `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    )
  }
  if (meta.video) {
    lines.push(
      `<meta property="og:video" content="${escapeHtml(meta.video)}" />`,
      `<meta property="og:video:secure_url" content="${escapeHtml(meta.video)}" />`,
    )
  }

  if (meta.jsonLd?.length) {
    // "</script>" inside the data would end the tag early, so the only
    // character that can do that is escaped.
    const graph = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': meta.jsonLd,
    }).replace(/</g, '\\u003c')
    lines.push(
      `<script type="application/ld+json">${graph}</script>`,
    )
  }

  return lines.map(tag).join('\n')
}

/**
 * index.html with the head replaced by this URL's metadata. The template's
 * own title and description are dropped first so nothing is duplicated.
 *
 * The file is read per request rather than cached: it is a kilobyte the OS
 * already has in memory, only page navigations get this far (assets are
 * served by express.static), and caching it means a rebuild without a
 * restart serves asset URLs that no longer exist.
 */
export async function renderPage(clientDist, meta) {
  const html = await readFile(join(clientDist, 'index.html'), 'utf8')
  return html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/i, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?>\n?/i, '')
    .replace(
      /([ \t]*)<\/head>/i,
      (_match, indent) => `${renderHead(meta)}\n${indent}</head>`,
    )
}

export function renderRobotsTxt(base) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
}

export function renderSitemap(base) {
  const urls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'weekly' },
    ...listProjects().map((project) => ({
      loc: `${base}${projectPath(project.id)}`,
      priority: '0.8',
      changefreq: 'monthly',
    })),
  ]

  const body = urls
    .map(
      ({ loc, priority, changefreq }) =>
        `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}
