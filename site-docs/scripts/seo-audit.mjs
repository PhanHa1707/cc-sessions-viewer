// Pure checks shared by the post-build audit and negative regression tests.
// These check generated markup, not search-engine eligibility, rank or live CDN access.
export const LOCALES = { '': 'en-US', 'zh/': 'zh-CN', 'ja/': 'ja-JP' }

export function routeOf(relativePath) {
  return '/' + relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
}

export function localeOf(relativePath) {
  const prefix = ['zh/', 'ja/'].find((value) => relativePath.startsWith(value)) ?? ''
  return { prefix, lang: LOCALES[prefix], base: relativePath.slice(prefix.length) }
}

// Editorial budgets for the English pages refined in the 2026-10-06 audit.
// These are project constraints, not engine eligibility limits or CJK budgets.
const ENGLISH_SNIPPET_PAGES = new Set([
  'agents/index.md', 'agents/opencode.md', 'features/read-and-search.md', 'features/export-and-trash.md',
  'guide/about.md', 'guide/claude-code-session-viewer.md', 'guide/codex-session-viewer.md',
  'guide/compatibility.md', 'guide/troubleshooting.md', 'tools/check-mcp.md',
  'tools/share-skills.md', 'tools/claude-code-cost-calculator.md', 'tools/claude-code-token-counter.md',
])

export function auditSnippet(document, relativePath) {
  if (!ENGLISH_SNIPPET_PAGES.has(relativePath)) return []
  const errors = []
  if ([...document.title].length > 70) errors.push('English title exceeds editorial budget (70 characters)')
  const description = document.querySelector('meta[name="description"]')?.content ?? ''
  if ([...description].length > 160) errors.push('English description exceeds editorial budget (160 characters)')
  return errors
}

export function auditPage(document, { relativePath, pages, siteUrl }) {
  const errors = auditSnippet(document, relativePath)
  const check = (ok, message) => { if (!ok) errors.push(message) }
  const { prefix, lang, base } = localeOf(relativePath)
  const url = siteUrl + routeOf(relativePath)
  const home = base === 'index.md'
  const title = document.title.trim()
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content
  const property = (name) => document.querySelector(`meta[property="${name}"]`)?.content

  check(Boolean(title) && !title.includes('VitePress'), 'missing or default title')
  if (home) check(title.includes('Sessions Viewer'), 'homepage title omits product name')
  check(document.documentElement.lang === lang, 'wrong document language')
  const descriptions = document.querySelectorAll('meta[name="description"]')
  check(descriptions.length === 1 && Boolean(descriptions[0].content.trim()), 'missing or duplicate description')
  const canonical = document.querySelectorAll('link[rel="canonical"]')
  check(canonical.length === 1 && canonical[0].getAttribute('href') === url, 'wrong or duplicate canonical')
  check(/\bindex\b/.test(meta('robots') ?? '') && !/noindex|nosnippet/i.test(meta('robots') ?? ''), 'index/snippet policy blocks content')
  check(property('og:url') === url, 'og:url does not match canonical')
  check(property('og:title') === title && meta('twitter:title') === title, 'social titles do not match page title')
  check(property('og:description') === meta('description') && meta('twitter:description') === meta('description'), 'social description does not match page description')
  const h1 = document.querySelectorAll('h1')
  check(h1.length === 1 && Boolean(h1[0].textContent.trim()), 'missing, empty or duplicate H1')

  const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
  for (const [targetPrefix, targetLang] of Object.entries(LOCALES)) {
    const rel = targetPrefix + base
    check(pages.has(rel), `missing translation: ${rel}`)
    const matching = alternates.filter((node) => node.hreflang === targetLang)
    check(matching.length === 1 && matching[0].getAttribute('href') === siteUrl + routeOf(rel), `wrong alternate: ${targetLang}`)
  }
  const defaults = alternates.filter((node) => node.hreflang === 'x-default')
  check(defaults.length === 1 && defaults[0].getAttribute('href') === siteUrl + routeOf(base), 'wrong x-default')

  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  check(scripts.length === 1, 'missing or duplicate JSON-LD')
  try {
    const data = JSON.parse(scripts[0]?.textContent ?? '')
    check(data['@context'] === 'https://schema.org' && Array.isArray(data['@graph']), 'invalid JSON-LD graph')
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : []
    const entity = (type) => graph.find((node) => node['@type'] === type)
    const webpage = entity('WebPage')
    check(webpage?.['@id'] === url + '#webpage' && webpage?.url === url && webpage?.inLanguage === lang, 'wrong WebPage entity')
    check(entity('WebSite')?.['@id'] === siteUrl + '/#website', 'wrong WebSite entity')
    check(entity('Organization')?.['@id'] === siteUrl + '/#organization', 'wrong publisher entity')
    if (home) {
      const app = entity('SoftwareApplication')
      check(app?.['@id'] === siteUrl + '/#app' && app?.url === url, 'wrong application entity')
      check(app?.mainEntityOfPage?.['@id'] === webpage?.['@id'], 'application is disconnected from WebPage')
      check(webpage?.mainEntity?.['@id'] === app?.['@id'], 'WebPage is disconnected from application')
    } else {
      const article = entity('TechArticle')
      const crumbs = entity('BreadcrumbList')
      check(article?.url === url && article?.inLanguage === lang, 'wrong article URL/language')
      check(article?.mainEntityOfPage?.['@id'] === webpage?.['@id'], 'article is disconnected from WebPage')
      check(webpage?.mainEntity?.['@id'] === article?.['@id'], 'WebPage is disconnected from article')
      check(webpage?.breadcrumb?.['@id'] === crumbs?.['@id'] && Boolean(crumbs), 'missing WebPage breadcrumb')
      const items = Array.isArray(crumbs?.itemListElement) ? crumbs.itemListElement : []
      check(items.length >= 2 && items.at(-1)?.item === url, 'breadcrumb does not end at current page')
      const pageLocales = new Map([...pages].map((path) => [siteUrl + routeOf(path), localeOf(path).prefix]))
      check(new Set(items.map((item) => item?.item)).size === items.length, 'duplicate breadcrumb URL')
      for (const [index, item] of items.entries()) {
        check(item?.['@type'] === 'ListItem', 'breadcrumb entry is not a ListItem')
        check(item?.position === index + 1, 'breadcrumb positions are not consecutive')
        check(typeof item?.name === 'string' && item.name.trim().length > 0, 'missing breadcrumb name')
        check(pageLocales.has(item?.item), `invalid breadcrumb item URL: ${String(item?.item)}`)
        if (pageLocales.has(item?.item)) check(pageLocales.get(item.item) === prefix, 'breadcrumb points to a different language')
      }
    }
  } catch {
    errors.push('JSON-LD cannot be parsed')
  }

  const content = document.querySelector('.vp-doc')
  check(Boolean(content) && content.textContent.trim().length > 80, 'content is not present in static HTML')
  for (const link of document.querySelectorAll('a[href^="/"]')) {
    const href = link.getAttribute('href')
    if (href.startsWith('//')) continue
    const target = href.split(/[?#]/)[0].replace(/\.html$/, '')
    const source = target.endsWith('/') ? target.slice(1) + 'index.md' : target.slice(1) + '.md'
    // VitePress's links are page routes. Asset links are checked by the build itself.
    if (/\.[a-z0-9]+$/i.test(target)) continue
    check(pages.has(source), `broken internal page link: ${href}`)
  }

  if (base.startsWith('agents/') || ['guide/privacy.md', 'guide/troubleshooting.md'].includes(base)) {
    check(/\b\d{4}-\d{2}-\d{2}\b/.test(content?.textContent ?? ''), 'missing source review date')
    check(Boolean(content?.querySelector('a[href*="/cc-sessions-viewer/blob/"]') ?? content?.querySelector('a[href*="/cc-sessions-viewer/tree/"]')), 'missing implementation evidence')
    check(Boolean(content?.querySelector(`a[href="/${prefix}guide/privacy"]`)) || base === 'guide/privacy.md', 'missing privacy boundary link')
  }
  return errors
}

export function auditSitemap(document, { pages, siteUrl }) {
  const errors = []
  const entries = [...document.getElementsByTagName('url')]
  const urls = entries.map((node) => [...node.children].find((child) => child.localName === 'loc')?.textContent)
  const expected = new Set([...pages].map((path) => siteUrl + routeOf(path)))
  for (const url of expected) if (!urls.includes(url)) errors.push(`missing sitemap URL: ${url}`)
  for (const url of urls) if (!expected.has(url)) errors.push(`unexpected sitemap URL: ${url}`)
  if (new Set(urls).size !== urls.length) errors.push('duplicate sitemap URL')
  for (const entry of entries) {
    const url = [...entry.children].find((child) => child.localName === 'loc')?.textContent
    const relativePath = [...pages].find((path) => siteUrl + routeOf(path) === url)
    if (!relativePath) continue
    const { base } = localeOf(relativePath)
    const links = [...entry.children].filter((child) => child.localName === 'link')
    for (const [prefix, lang] of Object.entries(LOCALES)) {
      const matching = links.filter((link) => link.getAttribute('hreflang') === lang)
      if (matching.length !== 1 || matching[0].getAttribute('href') !== siteUrl + routeOf(prefix + base)) errors.push(`wrong sitemap alternate ${lang}: ${url}`)
    }
    if (links.find((link) => link.getAttribute('hreflang') === 'x-default')?.getAttribute('href') !== siteUrl + routeOf(base)) errors.push(`wrong sitemap x-default: ${url}`)
  }
  return errors
}

export function auditRobots(text, siteUrl, pages = new Set(['index.md'])) {
  const errors = []
  const groups = []
  let group = { agents: [], rules: [] }
  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim()
    const match = line.match(/^(user-agent|allow|disallow):\s*(.*)$/i)
    if (!match) continue
    const [, key, value] = match
    if (key.toLowerCase() === 'user-agent') {
      if (group.rules.length) { groups.push(group); group = { agents: [], rules: [] } }
      group.agents.push(value.toLowerCase())
    } else {
      group.rules.push({ allow: key.toLowerCase() === 'allow', path: value })
    }
  }
  if (group.agents.length) groups.push(group)
  // Audit every rendered content route, not just /. This covers common path
  // rules, * / terminal $, merged exact-agent groups and longest-match precedence.
  // Training policy is independent; robots permission is not proof of access.
  const paths = new Set(['/', ...[...pages].map(routeOf)])
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const agent of ['googlebot', 'bingbot', 'oai-searchbot']) {
    const specific = groups.filter((item) => item.agents.includes(agent))
    const applicable = specific.length ? specific : groups.filter((item) => item.agents.includes('*'))
    const rules = applicable.flatMap((item) => item.rules).filter((rule) => rule.path).map((rule) => {
      const anchored = rule.path.endsWith('$')
      const pattern = anchored ? rule.path.slice(0, -1) : rule.path
      return { ...rule, length: Buffer.byteLength(pattern.replaceAll('*', ''), 'utf8'), matcher: new RegExp('^' + pattern.split('*').map(escape).join('.*') + (anchored ? '$' : '')) }
    })
    for (const path of paths) {
      const matching = rules.filter((rule) => rule.matcher.test(path)).sort((a, b) => b.length - a.length || Number(b.allow) - Number(a.allow))
      if (matching[0]?.allow === false) errors.push(`robots blocks search crawler ${agent} at ${path}`)
    }
  }
  if (!text.split('\n').some((line) => line.trim() === `Sitemap: ${siteUrl}/sitemap.xml`)) errors.push('robots sitemap URL is wrong')
  return errors
}
