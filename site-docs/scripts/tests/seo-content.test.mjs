import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (relativePath) => readFileSync(join(src, relativePath), 'utf8')
const locales = ['', 'zh/', 'ja/']

for (const locale of locales) {
  test(`${locale || 'en/'}search: selected source, matching boundaries and result caps`, () => {
    const text = read(locale + 'features/read-and-search.md')
    const selected = locale === 'zh/' ? '当前选中 agent' : locale === 'ja/' ? '選択中エージェント' : 'currently selected agent'
    assert.ok(text.includes(selected))
    for (const marker of ['{#search-scope}', '200', '80', '30', '69e0b4f', '2026-10-06', '0.6.0', '/guide/privacy', '/agents/mod.rs', '/GlobalSearchModal.vue', '/agents/opencode.rs']) assert.ok(text.includes(marker), marker)
    for (const destination of ['guide/codex-session-viewer#archived', 'features/export-and-trash']) assert.ok(text.includes('/' + locale + destination))
    for (const stale of ['every project and every agent at once', '所有项目、所有 agent', '全プロジェクト・全エージェントを一度に']) assert.ok(!text.includes(stale))
    const home = read(locale + 'index.md')
    assert.ok(home.includes(locale === 'zh/' ? '当前 agent' : locale === 'ja/' ? '選択中エージェント' : "selected agent's"))
  })
  test(`${locale || 'en/'}workflows: search limits and portable-image caveats`, () => {
    for (const name of ['claude-code', 'codex']) {
      const text = read(locale + 'guide/' + name + '-session-viewer.md')
      assert.ok(text.includes('/' + locale + 'features/read-and-search#search-scope'))
      assert.ok(text.includes('/' + locale + 'features/export-and-trash'))
      assert.ok(!/offline HTML|离线 HTML|オフライン HTML/.test(text))
      assert.match(text, locale === 'zh/' ? /远程或无法读取的图片/ : locale === 'ja/' ? /外部画像や読めない画像/ : /Remote or unreadable images/)
    }
  })
  test(`${locale || 'en/'}Pi export: native-entry envelope is distinct from parsed messages and raw backup`, () => {
    const text = read(locale + 'features/export-and-trash.md')
    for (const marker of ['{#pi-json}', 'cc-session-viewer-pi-export', 'header', 'entries', 'selectedLeafId', '69e0b4f', '2026-10-06', '/src/App.vue', '/src/export.ts', '/agents/pi.rs']) assert.ok(text.includes(marker), marker)
    assert.ok(text.includes(locale === 'zh/' ? '逐字节' : locale === 'ja/' ? 'バイト単位' : 'byte-for-byte'))
  })
  test(`${locale || 'en/'}opencode: recorded costs, missing-field limits and useful viewer steps`, () => {
    const text = read(locale + 'agents/opencode.md')
    for (const marker of ['session.cost', '`modelID`', '`tokens`', '{#cost-from-db}', '{#view-and-search}', '69e0b4f', '2026-10-06', 'mode=ro', '${XDG_DATA_HOME:-$HOME/.local/share}', 'opencode --session SESSION_ID']) assert.ok(text.includes(marker), marker)
    for (const route of ['features/stats#cost-vs-bill', 'features/read-and-search#search-scope', 'guide/install', 'guide/privacy']) assert.ok(text.includes('/' + locale + route))
    const missing = locale === 'zh/' ? '缺失的数值成本目前按零处理' : locale === 'ja/' ? '数値コストがない場合は現在ゼロ' : 'Missing numeric message costs currently default to zero'
    assert.ok(text.includes(missing))
    for (const stale of ['only trustworthy source', 'part of the bill', '唯一可信', '它们是账单的一部分', 'だけが信頼できる情報源', '請求の一部だから']) assert.ok(!text.includes(stale))
  })
}

test('README discovery copy preserves selected-source search and external-image limits', () => {
  for (const [filename, selected] of [
    ['README.md', "selected agent's"],
    ['README.zh-CN.md', '当前 agent'],
    ['README.ja.md', '選択中エージェント'],
  ]) {
    const text = readFileSync(join(src, '..', filename), 'utf8')
    assert.ok(text.includes(selected), filename)
    assert.ok(!/fully offline|完全离线|完全オフライン/i.test(text), filename)
  }
})

test('application Schema describes terminal/chat/search/cost boundaries instead of universal chat', () => {
  const config = read('.vitepress/config/shared.ts')
  for (const marker of [
    'Search session titles, IDs and user prompts across projects for the selected agent',
    'Terminal resume for all seven agents; in-app chat for Claude Code and Codex',
    'Recorded token usage with catalog-based cost estimates or opencode database-recorded costs',
  ]) assert.ok(config.includes(marker))
  assert.ok(!config.includes("'Resume a session in a terminal or in-app chat'"))
})

for (const customRoot of [false, true]) {
  test(`documented read-only opencode command respects ${customRoot ? 'custom XDG root' : 'default root and empty XDG'}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'sv-seo-xdg-'))
    try {
      const home = join(root, 'synthetic-home')
      const xdg = customRoot ? join(root, 'synthetic-xdg') : join(home, '.local/share')
      const directory = join(xdg, 'opencode')
      mkdirSync(directory, { recursive: true })
      const db = join(directory, 'opencode.db')
      const setup = spawnSync('sqlite3', [db], { input: read('public/examples/opencode.sql'), encoding: 'utf8' })
      assert.equal(setup.status, 0, setup.stderr || String(setup.error))
      const before = readFileSync(db)
      for (const locale of locales) {
        const command = read(locale + 'agents/opencode.md').match(/```bash\n(sqlite3 .+)\n```/)?.[1]
        assert.ok(command)
        const environments = customRoot ? [{ XDG_DATA_HOME: xdg }] : [{}, { XDG_DATA_HOME: '' }]
        for (const environment of environments) {
          const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-c', command], {
            // An isolated HOME/XDG and no inherited credentials; never a real database.
            env: { PATH: process.env.PATH, HOME: home, ...environment }, encoding: 'utf8',
          })
          assert.equal(result.status, 0, result.stderr || String(result.error))
          for (const table of ['project', 'session', 'message', 'part']) assert.match(result.stdout, new RegExp('\\b' + table + '\\b'))
          assert.deepEqual(readFileSync(db), before, 'read-only query changed synthetic database')
        }
      }
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
