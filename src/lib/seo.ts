import { useEffect } from 'react'

/**
 * Client-side page metadata.
 *
 * The crawler-facing head — canonical, Open Graph, Twitter, JSON-LD — is
 * rendered by the server for the first load of every URL (see
 * `server/src/seo.js`), because link scrapers don't run JavaScript. What is
 * left for the browser is keeping the tab title and description honest as
 * the visitor navigates between pages without a reload.
 */

export const siteName = 'RG General Contracts'

export const defaultTitle = 'RG General Contracts | مقاولات عامة وتشطيبات'

export const defaultDescription =
  'RG General Contracts — مقاولات عامة وتشطيبات وديكورات بإشراف هندسي. بإدارة م/ محمود الرويني'

/** A page's `<title>`: its own name, then the brand. */
export function pageTitle(title?: string): string {
  const trimmed = title?.trim()
  return trimmed ? `${trimmed} | ${siteName}` : defaultTitle
}

/** Squeeze body copy into something a search result can show whole. */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function setMetaContent(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  )
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = name
    document.head.appendChild(tag)
  }
  tag.content = content
}

export function useDocumentMeta({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  useEffect(() => {
    document.title = pageTitle(title)
    setMetaContent('description', description ?? defaultDescription)
  }, [title, description])
}
