import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { auditPage, auditRobots, auditSitemap } from './seo-audit.mjs'
import { auditUtility } from './utility-audit.mjs'

const src = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(src, '.vitepress/dist')
const siteUrl = (process.env.SITE_URL ?? 'https://sessions-viewer.js-bridge.com').replace(/\/$/, '')
function markdownPages(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || ['node_modules', 'public', 'scripts'].includes(entry.name)) return []
    const rel = prefix + entry.name
    if (entry.isDirectory()) return markdownPages(join(dir, entry.name), rel + '/')
    return entry.name.endsWith('.md') ? [rel] : []
  })
}
const pages = new Set(markdownPages(src))
const bad = []
const titles = new Map()
const descriptions = new Map()
for (const relativePath of pages) {
  let dom
  try {
    dom = new JSDOM(readFileSync(join(dist, relativePath.replace(/\.md$/, '.html')), 'utf8'))
    const document = dom.window.document
    for (const error of [...auditPage(document, { relativePath, pages, siteUrl }), ...auditUtility(document, relativePath)]) bad.push(`${relativePath}: ${error}`)
    for (const [label, value, seen] of [
      ['title', document.title, titles],
      ['description', document.querySelector('meta[name="description"]')?.content, descriptions],
    ]) {
      if (seen.has(value)) bad.push(`${relativePath}: duplicate ${label} with ${seen.get(value)}`)
      seen.set(value, relativePath)
    }
  } catch (error) {
    bad.push(`${relativePath}: ${error.message}`)
  } finally {
    dom?.window.close()
  }
}
try {
  const dom = new JSDOM(readFileSync(join(dist, 'sitemap.xml'), 'utf8'), { contentType: 'application/xml' })
  bad.push(...auditSitemap(dom.window.document, { pages, siteUrl }))
  dom.window.close()
  bad.push(...auditRobots(readFileSync(join(dist, 'robots.txt'), 'utf8'), siteUrl, pages))
} catch (error) {
  bad.push(`sitemap/robots: ${error.message}`)
}
// Downloaded examples must be the same bytes the command regressions consume.
for (const name of readdirSync(join(src, 'public/examples'))) {
  try {
    if (!readFileSync(join(src, 'public/examples', name)).equals(readFileSync(join(dist, 'examples', name)))) bad.push(`examples/${name}: differs from tested public sample`)
  } catch (error) {
    bad.push(`examples/${name}: ${error.message}`)
  }
}
try {
  if (!readFileSync(join(src, '../docs/screenshots/project-editor.png')).equals(readFileSync(join(dist, 'screenshots/project-editor.png')))) bad.push('priority screenshot: differs from verified source bytes')
} catch (error) {
  bad.push(`priority screenshot: ${error.message}`)
}
if (bad.length) {
  console.error(`[check-seo] ${bad.length} failed checks:\n${bad.map((line) => '  - ' + line).join('\n')}`)
  process.exit(1)
}
console.log(`[check-seo] ${pages.size} content pages: metadata, static content, language parity, links, JSON-LD, sitemap, robots, utility SSR and public samples passed`)
