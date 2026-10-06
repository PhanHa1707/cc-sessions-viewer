import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { SITE_ORIGIN, INDEXNOW_ENDPOINT, isContentPage, pageUrl, selectChanges, validateKey, validateUrls, notifyIndexNow } from '../indexnow-lib.mjs'

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = resolve(src, '..')
const a = 'site-docs/guide/a.md'
const b = 'site-docs/zh/guide/a.md'
const c = 'site-docs/guide/removed.md'
const key = 'synthetic-test-key-12345678'
const defaultSources = { [a]: 'English body', [b]: '中文正文', [c]: 'Removed body' }
function select(changedPaths, { beforePages = [a, b, c], afterPages = [a, b], before = defaultSources, after = defaultSources } = {}) {
  return selectChanges({ changedPaths, beforePages, afterPages, readBefore: (path) => before[path] ?? '', readAfter: (path) => after[path] ?? '' })
}
function plan(urls = [pageUrl(a)], removed = []) { return { from: 'before', to: 'after', origin: SITE_ORIGIN, urls, removed } }
function mockNetwork({ proofStatus = 200, proofText = key, pageStatus = 200, type = 'text/html; charset=utf-8', apiStatus = 200 } = {}) {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/' + key + '.txt')) return new Response(proofText, { status: proofStatus })
    if (url === INDEXNOW_ENDPOINT) return new Response('', { status: apiStatus })
    return new Response(null, { status: pageStatus, headers: { 'content-type': type } })
  }
  return { calls, fetchImpl }
}

test('production identity matches canonical config and package homepage', () => {
  assert.ok(readFileSync(resolve(src, '.vitepress/config/shared.ts'), 'utf8').includes("?? '" + SITE_ORIGIN + "'"))
  assert.equal(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).homepage, SITE_ORIGIN)
})
test('page routes preserve language roots and encode path segments', () => {
  assert.equal(pageUrl('site-docs/index.md'), SITE_ORIGIN + '/')
  assert.equal(pageUrl('site-docs/ja/index.md'), SITE_ORIGIN + '/ja/')
  assert.equal(pageUrl('site-docs/guide/index.md'), SITE_ORIGIN + '/guide/')
  assert.equal(pageUrl('site-docs/guide/中文.md'), SITE_ORIGIN + '/guide/' + encodeURIComponent('中文'))
  for (const path of ['README.md', 'site-docs/public/readme.md', 'site-docs/scripts/readme.md', 'site-docs/.vitepress/snippets/a.md', 'site-docs/node_modules/a.md']) {
    assert.equal(isContentPage(path), false)
    assert.throws(() => pageUrl(path))
  }
})
test('only genuinely changed source candidates, no unchanged-language fanout', () => {
  assert.deepEqual(select([a]).urls, [pageUrl(a)])
  assert.deepEqual(select(['README.md', 'site-docs/scripts/check-seo.mjs', '.github/workflows/ci.yml']).urls, [])
  assert.deepEqual(select([]).urls, [])
})
test('add/delete and rename endpoints are deduplicated with deletion state', () => {
  const result = select([a, a, c])
  assert.deepEqual(result.urls, [pageUrl(a), pageUrl(c)].sort())
  assert.deepEqual(result.removed, [pageUrl(c)])
  const renamed = select([a, 'site-docs/guide/new.md'], { beforePages: [a], afterPages: ['site-docs/guide/new.md'] })
  assert.deepEqual(renamed.urls, [pageUrl(a), pageUrl('site-docs/guide/new.md')].sort())
  assert.deepEqual(renamed.removed, [pageUrl(a)])
})
test('shared config and theme affect content pages, never emit snippet URLs', () => {
  for (const path of ['site-docs/.vitepress/config/shared.ts', 'site-docs/.vitepress/config.ts', 'site-docs/.vitepress/theme/index.ts', 'site-docs/public/robots.txt']) {
    assert.deepEqual(select([path]).urls, [pageUrl(a), pageUrl(b), pageUrl(c)].sort())
  }
})
test('included snippet dependencies are resolved against both revisions', () => {
  const snippet = 'site-docs/.vitepress/snippets/reference-en.md'
  const before = { [a]: '<!--@include: ../.vitepress/snippets/reference-en.md-->', [b]: '<!--@include: ../../.vitepress/snippets/reference-zh.md-->' }
  assert.deepEqual(select([snippet], { before, after: defaultSources }).urls, [pageUrl(a)])
  assert.deepEqual(select(['site-docs/.vitepress/snippets/unreferenced.md'], { before }).urls, [])
})
test('referenced public assets and synced screenshots select relevant pages', () => {
  const before = { [a]: 'image: /screenshots/special.png\n![one](/examples/pi.jsonl)', [b]: 'No image field: default cover' }
  assert.deepEqual(select(['site-docs/public/examples/pi.jsonl'], { before, after: before }).urls, [pageUrl(a)])
  assert.deepEqual(select(['docs/screenshots/special.png'], { before, after: before }).urls, [pageUrl(a)])
  assert.deepEqual(select(['docs/screenshots/cover.png'], { before, after: before }).urls, [pageUrl(b), pageUrl(c)].sort())
  assert.deepEqual(select(['site-docs/public/' + key + '.txt']).urls, [])
  assert.deepEqual(select(['docs/screenshots/session.gif']).urls, [])
})
test('package script changes do not notify; version changes notify three homepages', () => {
  const pages = ['site-docs/index.md', 'site-docs/zh/index.md', 'site-docs/ja/index.md']
  const before = { 'package.json': '{"version":"0.6.0"}' }
  assert.deepEqual(select(['package.json'], { before, after: { 'package.json': '{"version":"0.6.0","scripts":{"test":"node test"}}' } }).urls, [])
  assert.deepEqual(select(['package.json'], { beforePages: pages, afterPages: pages, before, after: { 'package.json': '{"version":"0.6.1"}' } }).urls, pages.map(pageUrl).sort())
})
test('key proof is root-level, HTTPS and same production origin', () => {
  assert.equal(validateKey(key), SITE_ORIGIN + '/' + key + '.txt')
  assert.equal(validateKey('a'.repeat(8), SITE_ORIGIN + '/indexnow-proof.txt'), SITE_ORIGIN + '/indexnow-proof.txt')
  validateKey('Z'.repeat(128))
  for (const value of ['', '1234567', 'a'.repeat(129), 'unsafe_key', '带中文12345678', undefined]) assert.throws(() => validateKey(value))
  for (const location of ['http://sessions-viewer.js-bridge.com/key.txt', 'https://preview.example/key.txt', SITE_ORIGIN + '/nested/key.txt', SITE_ORIGIN + '/proof.txt?key=value', SITE_ORIGIN + '/proof.txt#key', 'https://user:pass@sessions-viewer.js-bridge.com/proof.txt']) assert.throws(() => validateKey(key, location))
})
test('notification rejects foreign, preview, credential, noncanonical and oversize lists', () => {
  for (const url of ['https://preview.example/guide/a', 'http://sessions-viewer.js-bridge.com/', SITE_ORIGIN + '/guide/a?q=secret', SITE_ORIGIN + '/guide/a#prompt', SITE_ORIGIN + '/guide/../a', 'https://user:pass@sessions-viewer.js-bridge.com/']) assert.throws(() => validateUrls([url]))
  assert.throws(() => validateUrls([pageUrl(a), pageUrl(a)]))
  assert.throws(() => validateUrls(Array.from({ length: 10001 }, (_, i) => SITE_ORIGIN + '/page-' + i)))
  assert.throws(() => validateUrls([pageUrl(a)], [pageUrl(c)]))
})
test('dry-run and empty explicit submission do not make any HTTP requests', async () => {
  let count = 0
  const fetchImpl = async () => { count++; throw new Error('No HTTP allowed') }
  assert.equal((await notifyIndexNow(plan(), { fetchImpl })).mode, 'dry-run')
  assert.equal((await notifyIndexNow({ ...plan(), mode: 'submitted' }, { submit: 'true', fetchImpl })).mode, 'dry-run')
  assert.equal((await notifyIndexNow(plan([]), { submit: true, published: true, fetchImpl })).mode, 'no-changes')
  assert.equal(count, 0)
})
test('explicit publication and valid key are required before network operations', async () => {
  const network = mockNetwork()
  await assert.rejects(notifyIndexNow(plan(), { submit: true, fetchImpl: network.fetchImpl }), /published/)
  await assert.rejects(notifyIndexNow(plan(), { submit: true, published: 'true', fetchImpl: network.fetchImpl }), /published/)
  await assert.rejects(notifyIndexNow(plan(), { submit: true, published: true, fetchImpl: network.fetchImpl }), /INDEXNOW_KEY/)
  assert.equal(network.calls.length, 0)
})
for (const condition of [{ proofStatus: 404 }, { proofText: 'wrong-test-key' }]) {
  test('bad public key proof stops before URL preflight/POST: ' + JSON.stringify(condition), async () => {
    const network = mockNetwork(condition)
    await assert.rejects(notifyIndexNow(plan(), { submit: true, published: true, key, fetchImpl: network.fetchImpl }), /verification file/)
    assert.equal(network.calls.length, 1)
  })
}
for (const condition of [{ pageStatus: 404 }, { pageStatus: 302 }, { type: 'application/json' }]) {
  test('unpublished/non-HTML page stops before POST: ' + JSON.stringify(condition), async () => {
    const network = mockNetwork(condition)
    await assert.rejects(notifyIndexNow(plan(), { submit: true, published: true, key, fetchImpl: network.fetchImpl }), /preflight|HTML/)
    assert.ok(!network.calls.some((call) => call.options.method === 'POST'))
  })
}
test('removed URL must actually return 404/410; still-live deletion is blocked', async () => {
  const pending = mockNetwork()
  await assert.rejects(notifyIndexNow(plan([pageUrl(c)], [pageUrl(c)]), { submit: true, published: true, key, fetchImpl: pending.fetchImpl }), /preflight/)
  for (const pageStatus of [404, 410]) {
    const network = mockNetwork({ pageStatus })
    assert.equal((await notifyIndexNow(plan([pageUrl(c)], [pageUrl(c)]), { submit: true, published: true, key, fetchImpl: network.fetchImpl })).mode, 'submitted')
  }
})
for (const apiStatus of [200, 202]) {
  test(`accepted ${apiStatus}: precise payload, no redirects or indexing promises`, async () => {
    const network = mockNetwork({ apiStatus })
    const result = await notifyIndexNow(plan(), { submit: true, published: true, key, fetchImpl: network.fetchImpl })
    assert.equal(result.status, apiStatus)
    assert.match(result.result, /[Nn]o.*guarantee/)
    if (apiStatus === 202) assert.match(result.result, /pending/)
    const post = network.calls.at(-1)
    assert.equal(post.url, INDEXNOW_ENDPOINT)
    assert.deepEqual(JSON.parse(post.options.body), { host: new URL(SITE_ORIGIN).host, key, keyLocation: SITE_ORIGIN + '/' + key + '.txt', urlList: plan().urls })
    for (const call of network.calls) {
      assert.equal(call.options.redirect, 'error')
      assert.equal(call.options.credentials, 'omit')
      assert.ok(call.options.signal instanceof AbortSignal)
    }
  })
}
test('API error fails without claiming receipt', async () => {
  const network = mockNetwork({ apiStatus: 429 })
  await assert.rejects(notifyIndexNow(plan(), { submit: true, published: true, key, fetchImpl: network.fetchImpl }), /HTTP 429/)
})
test('network/key failures stop submission; no automatic retry', async () => {
  let count = 0
  await assert.rejects(notifyIndexNow(plan(), { submit: true, published: true, key, fetchImpl: async () => { count++; throw new Error('synthetic TLS failure') } }), /TLS/)
  assert.equal(count, 1)
})
test('CLI dry-run uses explicit real commit baselines without staging or submitting', () => {
  const env = { ...process.env }
  delete env.INDEXNOW_KEY
  delete env.INDEXNOW_KEY_LOCATION
  const result = spawnSync(process.execPath, [resolve(src, 'scripts/indexnow.mjs'), '--from', 'HEAD', '--to', 'HEAD'], { cwd: root, env, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.equal(output.mode, 'dry-run')
  assert.equal(output.from, output.to)
  assert.deepEqual(output.urls, [])
})
test('CLI rejects missing baselines, duplicate/unknown args and unconfirmed submission', () => {
  for (const args of [[], ['--from', 'HEAD'], ['--from', 'HEAD', '--to', 'HEAD', '--submit'], ['--from', 'HEAD', '--to', 'HEAD', '--published'], ['--from', 'HEAD', '--from', 'HEAD', '--to', 'HEAD'], ['--all'], ['--from', '--evil', '--to', 'HEAD']]) {
    const result = spawnSync(process.execPath, [resolve(src, 'scripts/indexnow.mjs'), ...args], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Usage:/)
  }
})
test('build, CI and standard tests have no submission command', () => {
  const site = JSON.parse(readFileSync(resolve(src, 'package.json'), 'utf8'))
  assert.ok(!site.scripts.build.includes('indexnow'))
  assert.ok(!readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8').includes('docs:indexnow'))
  assert.ok(!site.scripts.test.includes('--submit'))
})
