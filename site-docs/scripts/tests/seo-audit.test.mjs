import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { auditPage, auditRobots, auditSitemap, auditSnippet, routeOf, LOCALES } from '../seo-audit.mjs'

const siteUrl = 'https://docs.example.test'
const paths = ['index.md', 'agents/pi.md', 'guide/privacy.md']
const pages = new Set(Object.keys(LOCALES).flatMap((prefix) => paths.map((path) => prefix + path)))
const options = { relativePath: 'agents/pi.md', pages, siteUrl }
function page() {
  const url = siteUrl + '/agents/pi'
  const graph = [
    { '@type': 'Organization', '@id': siteUrl + '/#organization' },
    { '@type': 'WebSite', '@id': siteUrl + '/#website' },
    { '@type': 'WebPage', '@id': url + '#webpage', url, inLanguage: 'en-US', mainEntity: { '@id': url + '#article' }, breadcrumb: { '@id': url + '#breadcrumb' } },
    { '@type': 'TechArticle', '@id': url + '#article', url, inLanguage: 'en-US', mainEntityOfPage: { '@id': url + '#webpage' } },
    { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', name: 'Sessions Viewer', position: 1, item: siteUrl + '/' }, { '@type': 'ListItem', name: 'Pi session history', position: 2, item: url }] },
  ]
  return new JSDOM(`<html lang="en-US"><head>
    <title>Pi session history | Sessions Viewer</title>
    <meta name="description" content="Read Pi session records.">
    <meta name="robots" content="index, follow, max-snippet:-1">
    <link rel="canonical" href="${url}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="Pi session history | Sessions Viewer">
    <meta name="twitter:title" content="Pi session history | Sessions Viewer">
    <meta property="og:description" content="Read Pi session records.">
    <meta name="twitter:description" content="Read Pi session records.">
    ${Object.entries(LOCALES).map(([prefix, lang]) => `<link rel="alternate" hreflang="${lang}" href="${siteUrl}${routeOf(prefix + 'agents/pi.md')}">`).join('')}
    <link rel="alternate" hreflang="x-default" href="${url}">
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
    </head><body><div class="vp-doc"><h1>Pi session history</h1><p>Reference reviewed 2026-10-05. This is synthetic static content for regression tests, not evidence of a real CLI execution.</p>
    <a href="/guide/privacy">Privacy</a><a href="https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/pi.rs">Source</a></div></body></html>`)
}
function checkMutation(mutate) {
  const dom = page()
  try {
    mutate(dom.window.document)
    return auditPage(dom.window.document, options)
  } finally { dom.window.close() }
}

test('clean URL mapping preserves homepage and language roots', () => {
  assert.equal(routeOf('index.md'), '/')
  assert.equal(routeOf('zh/index.md'), '/zh/')
  assert.equal(routeOf('guide/index.md'), '/guide/')
  assert.equal(routeOf('ja/agents/pi.md'), '/ja/agents/pi')
})
test('valid static document passes', () => assert.deepEqual(checkMutation(() => {}), []))
test('missing, empty and duplicate H1 fail, including home-layout headings', () => {
  for (const mutate of [
    (d) => d.querySelector('h1').remove(),
    (d) => { d.querySelector('h1').textContent = ' ' },
    (d) => d.querySelector('.vp-doc').appendChild(d.querySelector('h1').cloneNode(true)),
  ]) assert.ok(checkMutation(mutate).includes('missing, empty or duplicate H1'))
  // VitePress's home hero is not a <main>. Do not incorrectly require main h1.
  assert.deepEqual(checkMutation((d) => {
    const hero = d.createElement('div')
    hero.className = 'VPHero'
    hero.appendChild(d.querySelector('h1'))
    d.body.prepend(hero)
  }), [])
})
test('Twitter description must agree with the visible page metadata', () => {
  assert.ok(checkMutation((d) => { d.querySelector('meta[name="twitter:description"]').content = 'Outdated copy' }).includes('social description does not match page description'))
})
test('focused English snippet budgets use final title and exclude translated pages', () => {
  const dom = page()
  try {
    const d = dom.window.document
    d.title = 'x'.repeat(70)
    d.querySelector('meta[name="description"]').content = 'x'.repeat(160)
    assert.deepEqual(auditSnippet(d, 'tools/claude-code-cost-calculator.md'), [])
    d.title += 'x'
    d.querySelector('meta[name="description"]').content += 'x'
    assert.deepEqual(auditSnippet(d, 'tools/claude-code-cost-calculator.md'), [
      'English title exceeds editorial budget (70 characters)',
      'English description exceeds editorial budget (160 characters)',
    ])
    for (const path of ['zh/tools/claude-code-cost-calculator.md', 'ja/tools/claude-code-cost-calculator.md', 'agents/pi.md']) assert.deepEqual(auditSnippet(d, path), [])
  } finally { dom.window.close() }
})
test('preview canonical fails', () => {
  assert.ok(checkMutation((d) => d.querySelector('link[rel="canonical"]').href = 'https://preview.example.test/agents/pi').includes('wrong or duplicate canonical'))
})
test('missing translation and bad hreflang fail', () => {
  assert.ok(checkMutation((d) => d.querySelector('link[hreflang="ja-JP"]').remove()).includes('wrong alternate: ja-JP'))
  const dom = page()
  try {
    const missing = new Set([...pages].filter((p) => p !== 'zh/agents/pi.md'))
    assert.ok(auditPage(dom.window.document, { ...options, pages: missing }).includes('missing translation: zh/agents/pi.md'))
  } finally { dom.window.close() }
})
test('noindex and missing static body fail', () => {
  const errors = checkMutation((d) => {
    d.querySelector('meta[name="robots"]').content = 'noindex, nosnippet'
    d.querySelector('.vp-doc').remove()
  })
  assert.ok(errors.includes('index/snippet policy blocks content'))
  assert.ok(errors.includes('content is not present in static HTML'))
})
test('invalid JSON-LD and disconnected article fail', () => {
  assert.ok(checkMutation((d) => d.querySelector('script').textContent = '{invalid').includes('JSON-LD cannot be parsed'))
  const errors = checkMutation((d) => {
    const script = d.querySelector('script')
    const graph = JSON.parse(script.textContent)
    graph['@graph'].find((node) => node['@type'] === 'TechArticle').mainEntityOfPage = 'https://wrong.example.test/'
    script.textContent = JSON.stringify(graph)
  })
  assert.ok(errors.includes('article is disconnected from WebPage'))
})
test('wrong document language and broken links fail', () => {
  const errors = checkMutation((d) => {
    d.documentElement.lang = 'zh-CN'
    d.querySelector('a[href="/guide/privacy"]').href = '/guide/missing'
  })
  assert.ok(errors.includes('wrong document language'))
  assert.ok(errors.includes('broken internal page link: /guide/missing'))
})
function mutateBreadcrumbs(document, mutate) {
  const script = document.querySelector('script[type="application/ld+json"]')
  const data = JSON.parse(script.textContent)
  mutate(data['@graph'].find((node) => node['@type'] === 'BreadcrumbList').itemListElement)
  script.textContent = JSON.stringify(data)
}

test('nonexistent intermediate breadcrumb route fails even if final page exists', () => {
  const errors = checkMutation((d) => mutateBreadcrumbs(d, (items) => {
    items[1].position = 3
    items.splice(1, 0, { '@type': 'ListItem', name: 'Features', position: 2, item: siteUrl + '/features/' })
  }))
  assert.ok(errors.includes('invalid breadcrumb item URL: ' + siteUrl + '/features/'))
})
test('foreign, preview, query and fragment breadcrumb URLs fail', () => {
  for (const item of ['https://elsewhere.example/', 'https://preview.example/agents/pi', siteUrl + '/?ref=tracking', siteUrl + '/#app']) {
    assert.ok(checkMutation((d) => mutateBreadcrumbs(d, (items) => { items[0].item = item })).includes('invalid breadcrumb item URL: ' + item))
  }
})
test('known breadcrumb page in another language fails', () => {
  assert.ok(checkMutation((d) => mutateBreadcrumbs(d, (items) => { items[0].item = siteUrl + '/zh/' })).includes('breadcrumb points to a different language'))
})
test('breadcrumb names, types, duplicate URLs and positions are checked', () => {
  const errors = checkMutation((d) => mutateBreadcrumbs(d, (items) => {
    items[0].name = ' '
    items[0]['@type'] = 'Thing'
    items[0].position = 9
    items[0].item = items[1].item
  }))
  for (const error of ['missing breadcrumb name', 'breadcrumb entry is not a ListItem', 'breadcrumb positions are not consecutive', 'duplicate breadcrumb URL']) assert.ok(errors.includes(error))
})

test('missing evidence fails', () => {
  const errors = checkMutation((d) => d.querySelector('a[href*="/blob/"]').remove())
  assert.ok(errors.includes('missing implementation evidence'))
})

function sitemap() {
  return new JSDOM(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${[...pages].map((path) => {
    const base = path.replace(/^(zh|ja)\//, '')
    return `<url><loc>${siteUrl}${routeOf(path)}</loc>${Object.entries(LOCALES).map(([prefix, lang]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${siteUrl}${routeOf(prefix + base)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${routeOf(base)}"/></url>`
  }).join('')}</urlset>`, { contentType: 'application/xml' })
}
test('sitemap accepts locale parity and rejects missing/duplicate URLs', () => {
  const dom = sitemap()
  try {
    assert.deepEqual(auditSitemap(dom.window.document, { pages, siteUrl }), [])
    const urls = dom.window.document.getElementsByTagName('url')
    urls[0].remove()
    urls[0].parentNode.appendChild(urls[0].cloneNode(true))
    const errors = auditSitemap(dom.window.document, { pages, siteUrl })
    assert.ok(errors.includes(`missing sitemap URL: ${siteUrl}/`))
    assert.ok(errors.includes('duplicate sitemap URL'))
  } finally { dom.window.close() }
})
test('homepage title must name the product', () => {
  const dom = page()
  try {
    dom.window.document.title = 'Coding CLI history'
    const errors = auditPage(dom.window.document, { ...options, relativePath: 'index.md' })
    assert.ok(errors.includes('homepage title omits product name'))
  } finally { dom.window.close() }
})

const robotsWith = (rules) => rules + `\nSitemap: ${siteUrl}/sitemap.xml\n`
test('root permission cannot mask blocked content paths', () => {
  const errors = auditRobots(robotsWith('User-agent: *\nAllow: /\nDisallow: /guide/'), siteUrl, pages)
  assert.equal(errors.length, 3)
  assert.ok(errors.every((error) => error.endsWith('at /guide/privacy')))
})
test('robots wildcards, longest allow and end anchors respect actual paths', () => {
  const samplePages = new Set(['index.md', 'guide/privacy.md', 'guide/privacy-extra.md'])
  assert.deepEqual(auditRobots(robotsWith('User-agent: *\nDisallow: /guide/*\nAllow: /guide/privacy'), siteUrl, samplePages), [])
  const errors = auditRobots(robotsWith('User-agent: *\nDisallow: /guide/privacy$'), siteUrl, samplePages)
  assert.equal(errors.length, 3)
  assert.ok(errors.every((error) => error.endsWith('at /guide/privacy')))
  assert.equal(auditRobots(robotsWith('User-agent: *\nDisallow: /*privacy*'), siteUrl, samplePages).length, 6)
})
test('longest disallow wins and equal-length allow wins regardless of rule order', () => {
  assert.equal(auditRobots(robotsWith('User-agent: *\nAllow: /\nDisallow: /agents/pi'), siteUrl, pages).length, 3)
  for (const rules of ['Allow: /guide/\nDisallow: /guide/', 'Disallow: /guide/\nAllow: /guide/']) {
    assert.deepEqual(auditRobots(robotsWith('User-agent: *\n' + rules), siteUrl, pages), [])
  }
})
test('specific search-agent groups override wildcard, merge and stay case insensitive', () => {
  const text = robotsWith('User-agent: *\nDisallow: /guide/\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: oai-searchbot\nDisallow: /guide/privacy$')
  const errors = auditRobots(text, siteUrl, pages)
  assert.equal(errors.length, 3)
  assert.ok(errors.some((error) => error.includes('oai-searchbot') && error.endsWith('at /guide/privacy')))
  assert.deepEqual(auditRobots(robotsWith('User-agent: *\nDisallow:\nAllow:'), siteUrl, pages), [])
})
test('robots patterns escape literal regex characters', () => {
  const samplePages = new Set(['index.md', 'guide/price.v1.md', 'guide/price-v1.md'])
  const errors = auditRobots(robotsWith('User-agent: *\nDisallow: /guide/price.v1$'), siteUrl, samplePages)
  assert.equal(errors.length, 3)
  assert.ok(errors.every((error) => error.endsWith('at /guide/price.v1')))
})

test('search and training crawler policies are independent', () => {
  const robots = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  assert.deepEqual(auditRobots(robots, siteUrl), [])
  assert.ok(auditRobots(robots + '\nUser-agent: OAI-SearchBot\nDisallow: /\n', siteUrl).some((error) => error.includes('oai-searchbot')))
  assert.ok(auditRobots(robots.replace('Allow: /', 'Disallow: /'), siteUrl).some((error) => error.includes('googlebot')))
})
