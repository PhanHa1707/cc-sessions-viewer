import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const root = resolve(src, '..')
const locales = ['', 'zh/', 'ja/']
const routes = [
  'guide/claude-code-session-viewer', 'guide/codex-session-viewer',
  'guide/compatibility', 'guide/about', 'tools/share-skills', 'tools/check-mcp',
]
const read = (path) => readFileSync(path, 'utf8')

for (const locale of locales) {
  test(`${locale || 'en/'}task content: unique metadata, evidence and discoverable routes`, () => {
    const metadata = new Set()
    const config = read(join(src, '.vitepress/config', locale ? locale.slice(0, -1) + '.ts' : 'en.ts'))
    const home = read(join(src, locale, 'index.md'))
    for (const route of routes) {
      const text = read(join(src, locale, route + '.md'))
      const title = text.match(/^title: (.+)$/m)?.[1]
      const description = text.match(/^description: (.+)$/m)?.[1]
      assert.ok(title && description, route + ' needs metadata')
      assert.ok(!metadata.has(title) && !metadata.has(description), route + ' duplicates metadata')
      metadata.add(title)
      metadata.add(description)
      // A reviewed historical version remains valid when the app later releases.
      assert.match(text, /\b\d{4}-\d{2}-\d{2}\b/, route + ' needs a real review date')
      assert.match(text, /\b\d+\.\d+\.\d+\b/, route + ' needs a reviewed version')
      assert.ok(text.includes('/' + locale + 'guide/privacy'), route + ' needs privacy boundary')
      assert.ok(config.includes('/' + locale + route), route + ' needs sidebar link')
      assert.ok(home.includes('/' + locale + route), route + ' needs home link')
    }
  })
  test(`${locale || 'en/'}capabilities: explicit runtime limits and public downloads`, () => {
    const text = read(join(src, locale, 'guide/compatibility.md'))
    for (const marker of ['{#support-matrix}', '{#synthetic-samples}', '{#offline-parser-tests}', 'npm run docs:test:adapters', '--locked --offline docs_public_fixture']) assert.ok(text.includes(marker))
    const unvalidated = locale === 'zh/' ? '未验证' : locale === 'ja/' ? '未検証' : 'Not validated in this docs pass'
    assert.equal(text.split(unvalidated).length - 1, 7, 'each CLI row must be unvalidated')
    for (const name of readdirSync(join(src, 'public/examples'))) assert.ok(text.includes('/examples/' + name), name + ' needs download link')
    const codex = read(join(src, locale, 'guide/codex-session-viewer.md'))
    assert.ok(codex.includes('{#archived}') && codex.includes('~/.codex/archived_sessions/'))
    for (const agent of ['claude-code', 'codex']) assert.ok(read(join(src, locale, 'agents', agent + '.md')).includes('/' + locale + 'guide/' + agent + '-session-viewer'))
    const stats = read(join(src, locale, 'features/stats.md'))
    for (const term of ['Antigravity', 'js-bridge', 'models.dev', '24', '{#cost-vs-bill}', '{#subscription-quota}']) assert.ok(stats.includes(term))
    assert.ok(!stats.includes('LiteLLM') && !stats.includes('Fable 5'), 'no unsupported release-speed anecdotes')
  })
  test(`${locale || 'en/'}export, shell and brand boundaries remain explicit`, () => {
    assert.match(read(join(src, locale, 'index.md')), /^title: Sessions Viewer\b/m)
    const exportPage = read(join(src, locale, 'features/export-and-trash.md'))
    for (const marker of ['⌘E', 'Ctrl+E', 'Markdown', '{#offline-images}', 'http(s)']) assert.ok(exportPage.includes(marker))
    const shell = read(join(src, locale, 'features/resume.md'))
    for (const marker of ['npm run dev', locale === 'zh/' ? '新 Shell' : locale === 'ja/' ? '新しいシェル' : 'new shell']) assert.ok(shell.includes(marker))
    const stale = [/press `⌘E` and choose/, /按 `⌘E`，选择/, /`⌘E` で Markdown、HTML、JSON を選び/, /Fully offline/, /完全离线/, /完全にオフライン/, /still there tomorrow/, /明天还在/, /明日もそこにあります/]
    for (const pattern of stale) assert.ok(!pattern.test(exportPage + shell), pattern.toString())
  })
  test(`${locale || 'en/'}tools: existing public anchors remain available`, () => {
    const text = read(join(src, locale, 'tools/index.md'))
    for (const id of ['skills', 'mcp', 'discover', 'hooks']) assert.ok(text.includes('{#' + id + '}'))
    const oldRuleAnchor = locale === 'zh/' ? '两条始终成立的规则' : locale === 'ja/' ? '常に守られる-2-つのこと' : 'two-rules-that-always-hold'
    assert.ok(text.includes('{#' + oldRuleAnchor + '}'))
    for (const route of ['tools/share-skills', 'tools/check-mcp']) assert.ok(text.includes('/' + locale + route))
  })
}

test('README: no lossless backup, offline-app or Gatekeeper safety assertions', () => {
  const stale = [
    /lossless JSON/, /无损 JSON/, /可逆 JSON/,
    /source JSONL files are never modified or removed/, /原始 JSONL 始终只读/,
    /オリジナルの JSONL は変更・削除しません/,
    /not a sign something is wrong/, /不代表有问题/, /異常ではありません/,
  ]
  for (const name of ['README.md', 'README.zh-CN.md', 'README.ja.md']) {
    const text = read(join(root, name))
    for (const pattern of stale) assert.ok(!pattern.test(text), name + ': ' + pattern)
    for (const route of ['guide/privacy', 'guide/compatibility', 'guide/about', 'guide/claude-code-session-viewer', 'guide/codex-session-viewer']) assert.ok(text.includes(route))
  }
})
