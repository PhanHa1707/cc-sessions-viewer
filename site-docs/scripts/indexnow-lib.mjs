// Source-change candidates, not evidence that a deployment happened or indexing succeeded.
// Network operations are confined to notifyIndexNow() with explicit submit + published flags.
import { posix } from 'node:path'
import { routeOf } from './seo-audit.mjs'

export const SITE_ORIGIN = 'https://sessions-viewer.js-bridge.com'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export function isContentPage(path) {
  if (!path.startsWith('site-docs/') || !path.endsWith('.md')) return false
  return !path.slice('site-docs/'.length).split('/').some((part) => part.startsWith('.') || ['public', 'scripts', 'node_modules'].includes(part))
}

export function pageUrl(path) {
  if (!isContentPage(path)) throw new Error('Not a documentation content page: ' + path)
  return SITE_ORIGIN + routeOf(path.slice('site-docs/'.length)).split('/').map(encodeURIComponent).join('/')
}

function assetPath(path) {
  if (path.startsWith('site-docs/public/')) return '/' + path.slice('site-docs/public/'.length)
  if (path.startsWith('docs/screenshots/') && !path.endsWith('/session.gif')) return '/screenshots/' + path.slice('docs/screenshots/'.length)
  return undefined
}

export function selectChanges({ changedPaths, beforePages, afterPages, readBefore, readAfter }) {
  const before = new Set(beforePages.filter(isContentPage))
  const after = new Set(afterPages.filter(isContentPage))
  const all = new Set([...before, ...after])
  const reasons = new Map()
  const add = (page, reason) => {
    if (!all.has(page)) return
    if (!reasons.has(page)) reasons.set(page, new Set())
    reasons.get(page).add(reason)
  }
  const sourceCache = new Map()
  const sources = (page) => {
    if (!sourceCache.has(page)) sourceCache.set(page, [before.has(page) ? readBefore(page) : '', after.has(page) ? readAfter(page) : ''])
    return sourceCache.get(page)
  }
  for (const path of new Set(changedPaths)) {
    if (isContentPage(path)) add(path, 'page source changed')
    if (/^site-docs\/\.vitepress\/(config\.ts|config\/|theme\/)/.test(path) || ['site-docs/public/robots.txt', 'site-docs/public/logo.png'].includes(path)) {
      for (const page of all) add(page, 'shared configuration/theme/policy changed: ' + path)
    }
    if (path.startsWith('site-docs/.vitepress/snippets/')) {
      for (const page of all) {
        const includes = sources(page).flatMap((text) => [...text.matchAll(/<!--\s*@include:\s*([^>]+?)\s*-->/g)].map((match) => posix.normalize(posix.join(posix.dirname(page), match[1].trim().replace(/\{[^}]*\}$/, '')))))
        if (includes.includes(path)) add(page, 'included snippet changed: ' + path)
      }
    }
    const asset = assetPath(path)
    if (asset) {
      for (const page of all) {
        if (sources(page).some((text) => text.includes(asset) || (asset === '/screenshots/cover.png' && !/^image:/m.test(text)))) add(page, 'referenced/default asset changed: ' + path)
      }
    }
    if (path === 'package.json') {
      if (JSON.parse(readBefore(path)).version !== JSON.parse(readAfter(path)).version) {
        for (const page of ['site-docs/index.md', 'site-docs/zh/index.md', 'site-docs/ja/index.md']) add(page, 'application version changed')
      }
    }
  }
  const pages = [...reasons.keys()].sort()
  const urls = [...new Set(pages.map(pageUrl))].sort()
  const currentUrls = new Set([...after].map(pageUrl))
  return {
    urls,
    removed: urls.filter((url) => !currentUrls.has(url)),
    reasons: Object.fromEntries(pages.map((page) => [page, [...reasons.get(page)].sort()])),
  }
}

export function validateKey(key, keyLocation = `${SITE_ORIGIN}/${key}.txt`) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY must contain 8–128 ASCII letters, digits or hyphens')
  const url = new URL(keyLocation)
  // Root-level proof covers all three languages; disallow redirects and foreign hosts.
  if (url.origin !== SITE_ORIGIN || url.username || url.password || url.search || url.hash || !/^\/[A-Za-z0-9_-]+\.txt$/.test(url.pathname)) throw new Error('INDEXNOW_KEY_LOCATION must be a root-level HTTPS .txt file on the production origin')
  return url.href
}

export function validateUrls(urls, removed = []) {
  if (!Array.isArray(urls) || urls.length > 10000 || new Set(urls).size !== urls.length) throw new Error('Provide at most 10,000 distinct changed URLs')
  for (const value of urls) {
    const url = new URL(value)
    if (url.origin !== SITE_ORIGIN || url.username || url.password || url.search || url.hash || url.href !== value || value.length > 2048) throw new Error('Only canonical production URLs without credentials, query or fragment are allowed')
  }
  if (!Array.isArray(removed) || removed.some((url) => !urls.includes(url))) throw new Error('Removed URLs must be a subset of the changed URLs')
}

const requestOptions = (method) => ({ method, redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(15000) })

export async function notifyIndexNow(plan, { submit = false, published = false, key, keyLocation, fetchImpl = globalThis.fetch } = {}) {
  validateUrls(plan.urls, plan.removed)
  if (submit !== true) return { ...plan, mode: 'dry-run' }
  if (published !== true) throw new Error('Submission requires --published: explicitly confirm this exact URL list is deployed')
  if (!plan.urls.length) return { ...plan, mode: 'no-changes' }
  const proofUrl = validateKey(key, keyLocation)
  const proof = await fetchImpl(proofUrl, requestOptions('GET'))
  if (proof.status !== 200 || (await proof.text()).trim() !== key) throw new Error('Public verification file is unavailable or does not match INDEXNOW_KEY')

  // Stop before POST if any changed page is not available, or a deletion is not yet live.
  const removed = new Set(plan.removed ?? [])
  for (const url of plan.urls) {
    const response = await fetchImpl(url, requestOptions('HEAD'))
    const expected = removed.has(url) ? [404, 410] : [200]
    if (!expected.includes(response.status)) throw new Error(`Publication preflight failed (${response.status}): ${url}`)
    if (!removed.has(url) && !/text\/html/i.test(response.headers.get('content-type') ?? '')) throw new Error('Changed page does not return HTML: ' + url)
  }
  const payload = { host: new URL(SITE_ORIGIN).host, key, keyLocation: proofUrl, urlList: plan.urls }
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    ...requestOptions('POST'), headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload),
  })
  if (![200, 202].includes(response.status)) throw new Error('IndexNow rejected the notification: HTTP ' + response.status)
  return { ...plan, mode: 'submitted', status: response.status, result: response.status === 202
    ? 'Received; IndexNow key validation pending. No guarantee of indexing or AI citation'
    : 'Notification received, not a guarantee of indexing or AI citation' }
}
