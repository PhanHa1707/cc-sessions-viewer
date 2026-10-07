import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { calculateCost, countClaudeUsage, CATEGORIES, MODELS, EXAMPLE_JSONL, MAX_BYTES, MAX_LINES, PRICING_CHECKED, PRICING_SOURCE, ToolError } from '../../.vitepress/theme/lib/usage-tools.mjs'
const zero = () => Object.fromEntries(CATEGORIES.map(key => [key, 0]))
const row = (usage, id = 'example') => JSON.stringify({ type: 'assistant', message: { id, usage } })
const usage = (input = 100, output = 40) => ({ input_tokens: input, output_tokens: output })
const error = code => err => err instanceof ToolError && err.code === code

test('reviewed registry: exact category rates and exceptional Opus cache reads', () => {
  assert.equal(PRICING_CHECKED, '2026-10-06')
  assert.equal(PRICING_SOURCE, 'https://platform.claude.com/docs/en/about-claude/pricing')
  const expected = [[2,10,.2,2.5,4],[2,10,.2,2.5,4],[4,20,.2,5,8],[5,25,.5,6.25,10],[5,25,.5,6.25,10],[3,15,.3,3.75,6],[1,5,.1,1.25,2]]
  assert.deepEqual(MODELS.map(model => CATEGORIES.map(key => model.rates[key])), expected)
  assert.ok(Object.isFrozen(MODELS) && MODELS.every(model => Object.isFrozen(model.rates)))
  assert.equal(new Set(MODELS.map(model => model.id)).size, MODELS.length)
})
test('calculator: independent public example and monthly projection', () => {
  const result = calculateCost({ input: 10000, output: 5000, cacheRead: 300000, cacheWrite5m: 10000, cacheWrite1h: 0 }, MODELS[0].rates, 4, 22)
  assert.ok(Math.abs(result.total - .155) < 1e-12)
  assert.ok(Math.abs(result.monthly - 13.64) < 1e-12)
  assert.deepEqual(result.rows.map(item => item.cost), [.02, .05, .06, .025, 0])
  assert.equal(result.tokenTotal, 325000)
})
test('calculator: separate TTLs, zero and custom rates, no intermediate rounding', () => {
  assert.equal(calculateCost(zero(), MODELS[0].rates).total, 0)
  assert.equal(calculateCost({ ...zero(), cacheWrite5m: 1e6, cacheWrite1h: 1e6 }, MODELS[0].rates).total, 6.5)
  assert.equal(calculateCost({ ...zero(), input: 1 }, { ...zero(), input: .0001 }).total, 1e-10)
  assert.equal(calculateCost({ ...zero(), input: '100' }, { ...zero(), input: '2.5' }).total, .00025)
})
for (const bad of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '', ' ', 'words', null, undefined]) {
  test(`calculator rejects invalid token ${String(bad)}`, () => assert.throws(() => calculateCost({ ...zero(), input: bad }, MODELS[0].rates), error('tokens')))
}
test('calculator rejects invalid rates, schedules and result overflow', () => {
  for (const bad of [-1, NaN, Infinity, '', null, undefined, 'USD 3']) assert.throws(() => calculateCost(zero(), { ...MODELS[0].rates, input: bad }), error('rates'))
  for (const [s, d] of [[0,22],[1001,22],[1,0],[1,32],[1.1,22],[1,1.1]]) assert.throws(() => calculateCost(zero(), MODELS[0].rates, s, d))
  assert.throws(() => calculateCost({ ...zero(), input: Number.MAX_SAFE_INTEGER, output: 1 }, MODELS[0].rates), error('overflow'))
  assert.throws(() => calculateCost({ ...zero(), input: Number.MAX_SAFE_INTEGER }, { ...zero(), input: Number.MAX_VALUE }), error('overflow'))
})
test('counter: public example coalesces zero streaming row, preserves split total', () => {
  const result = countClaudeUsage(EXAMPLE_JSONL)
  assert.deepEqual(result.usage, { input:150, output:60, cacheRead:1200, cacheWrite:300, total:1710 })
  assert.equal(result.records, 2); assert.equal(result.diagnostics.duplicates, 1)
  assert.equal(result.diagnostics.inconsistentCache, 0)
})
test('counter: choose entire highest-total snapshot, tie last, reverse order stable', () => {
  const first = row(usage(100,0)), second = row(usage(0,200))
  assert.equal(countClaudeUsage(first+'\n'+second).usage.input, 0)
  assert.equal(countClaudeUsage(second+'\n'+first).usage.total, 200)
  assert.equal(countClaudeUsage(row(usage(100,0))+'\n'+row(usage(0,100))).usage.input, 0)
})
test('counter: missing IDs are counted separately and cannot collide with explicit IDs', () => {
  const raw = row(usage(1,1), undefined).replace('"id":"example",','')
  const result = countClaudeUsage([raw,raw,row(usage(2,2),'anonymous:0')].join('\n'))
  assert.equal(result.records,3); assert.equal(result.diagnostics.missingIds,2); assert.equal(result.usage.total,8)
})
test('counter: cache total versus split is never double-added and differences are visible', () => {
  const result = countClaudeUsage(row({ ...usage(), cache_creation_input_tokens:300, cache_creation:{ephemeral_5m_input_tokens:100,ephemeral_1h_input_tokens:100} }))
  assert.equal(result.usage.cacheWrite,300); assert.equal(result.diagnostics.inconsistentCache,1)
  assert.equal(countClaudeUsage(row({ ...usage(), cache_creation:{ephemeral_1h_input_tokens:200} })).usage.cacheWrite,200)
})
test('counter: malformed, unsupported, missing and invalid usage distinguish unmeasured from zero', () => {
  const result = countClaudeUsage(['{', '{"type":"user"}', '{"type":"assistant","message":{}}', row({output_tokens:20}), row({...usage(),cache_read_input_tokens:null}), row({...usage(),input_tokens:'100'}), row(usage(0,0))].join('\n'))
  assert.equal(result.records,1); assert.equal(result.usage.total,0)
  assert.equal(result.diagnostics.malformedLines,1); assert.equal(result.diagnostics.missingUsage,1); assert.equal(result.diagnostics.invalidUsage,3); assert.equal(result.diagnostics.ignoredLines,1)
  assert.equal(countClaudeUsage('hello prompt text').records,0)
})
test('counter: CRLF, BOM, trailing blanks and legitimate zero are supported', () => {
  assert.equal(countClaudeUsage('\uFEFF'+row(usage(0,0))+'\r\n\r\n').records,1)
  assert.equal(countClaudeUsage('').records,0)
})
test('counter: byte/line limits including multi-byte text and aggregate overflow', () => {
  assert.throws(() => countClaudeUsage('x'.repeat(MAX_BYTES+1)),error('size'))
  assert.throws(() => countClaudeUsage('中'.repeat(Math.floor(MAX_BYTES/3)+1)),error('size'))
  assert.equal(countClaudeUsage((row(usage())+'\n').repeat(MAX_LINES)).records,1)
  assert.throws(() => countClaudeUsage('\n'.repeat(MAX_LINES+1)),error('lines'))
  assert.throws(() => countClaudeUsage([row(usage(Number.MAX_SAFE_INTEGER,0),'a'),row(usage(1,0),'b')].join('\n')),error('overflow'))
})
test('counter returns no transcript content, tool arguments, model metadata or IDs', () => {
  const record = {type:'assistant',message:{id:'private-id',model:'private-model',usage:usage(),content:[{type:'tool_use',input:{token:'private-secret'}}]}}
  const result = JSON.stringify(countClaudeUsage(JSON.stringify(record)))
  for (const text of ['private-id','private-model','private-secret','tool_use']) assert.ok(!result.includes(text))
})
test('browser tool source has no network, execution or persistence primitives', () => {
  for (const path of ['lib/usage-tools.mjs','components/CostCalculator.vue','components/TokenCounter.vue']) {
    const source = readFileSync(new URL('../../.vitepress/theme/'+path,import.meta.url),'utf8')
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|eval|spawn|exec)\s*(?:\(|\.)/)
    assert.doesNotMatch(source,/v-html|console\.(?:log|error)/)
  }
})
for (const prefix of ['', 'zh/', 'ja/']) test(`${prefix || 'en/'}utility routes are substantive, distinct, linked and privacy scoped`, () => {
  for (const route of ['claude-code-cost-calculator','claude-code-token-counter']) {
    const text = readFileSync(new URL('../../'+prefix+'tools/'+route+'.md',import.meta.url),'utf8')
    assert.match(text,/^title: .+$/m); assert.match(text,/^description: .+$/m); assert.match(text,/2026-10-06/)
    assert.ok(text.includes('/'+prefix+'guide/privacy'))
    assert.ok(text.includes('/'+prefix+'features/stats'))
    assert.ok(text.length > 1800)
    for (const path of ['index.md','features/stats.md','tools/index.md','guide/claude-code-session-viewer.md']) assert.ok(readFileSync(new URL('../../'+prefix+path,import.meta.url),'utf8').includes('/'+prefix+'tools/'+route),path)
    const config = readFileSync(new URL('../../.vitepress/config/'+(prefix ? prefix.slice(0,-1) : 'en')+'.ts',import.meta.url),'utf8')
    assert.ok(config.includes('/'+prefix+'tools/'+route))
    if (route.endsWith('calculator')) {
      for (const marker of ['{#formula}','{#rates}','{#subscription}','$0.155','$13.64','PricingTable',PRICING_SOURCE]) assert.ok(text.includes(marker),marker)
    } else for (const marker of ['{#dedup}','{#coverage}','{#prompt-text}','1,710','5 MiB','20,000','message.usage']) assert.ok(text.includes(marker),marker)
  }
})
