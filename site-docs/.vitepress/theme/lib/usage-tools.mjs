// Browser-only utilities. No requests, storage, CLI calls or transcript discovery.
export const PRICING_CHECKED = '2026-10-06'
export const PRICING_SOURCE = 'https://platform.claude.com/docs/en/about-claude/pricing'
export const CATEGORIES = Object.freeze(['input', 'output', 'cacheRead', 'cacheWrite5m', 'cacheWrite1h'])
const preset = (id, name, input, output, cacheRead, cacheWrite5m, cacheWrite1h) =>
  Object.freeze({ id, name, rates: Object.freeze({ input, output, cacheRead, cacheWrite5m, cacheWrite1h }) })
// Explicit reviewed USD/MTok rates: cache reads are NOT universally 0.1x input.
export const MODELS = Object.freeze([
  preset('sonnet-5-5', 'Claude Sonnet 5.5', 2, 10, 0.2, 2.5, 4),
  preset('sonnet-5', 'Claude Sonnet 5', 2, 10, 0.2, 2.5, 4),
  preset('opus-5-5', 'Claude Opus 5.5', 4, 20, 0.2, 5, 8),
  preset('opus-4-8', 'Claude Opus 4.8', 5, 25, 0.5, 6.25, 10),
  preset('opus-4-6', 'Claude Opus 4.6', 5, 25, 0.5, 6.25, 10),
  preset('sonnet-4-6', 'Claude Sonnet 4.6', 3, 15, 0.3, 3.75, 6),
  preset('haiku-4-5', 'Claude Haiku 4.5', 1, 5, 0.1, 1.25, 2),
])
export const MAX_BYTES = 5 * 1024 * 1024
export const MAX_LINES = 20_000
export class ToolError extends Error {
  constructor(code, field = '') { super(code); this.name = 'ToolError'; this.code = code; this.field = field }
}
function count(value, field) {
  if (typeof value === 'string') {
    if (!/^\d+$/.test(value.trim())) throw new ToolError('tokens', field)
    value = Number(value.trim())
  }
  if (!Number.isSafeInteger(value) || value < 0) throw new ToolError('tokens', field)
  return value
}
function rate(value, field) {
  if (typeof value === 'string') {
    if (!/^\d+(?:\.\d+)?$/.test(value.trim())) throw new ToolError('rates', field)
    value = Number(value.trim())
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new ToolError('rates', field)
  return value
}
function sumCounts(values) {
  const total = values.reduce((a, b) => a + b, 0)
  if (!Number.isSafeInteger(total)) throw new ToolError('overflow')
  return total
}
export function calculateCost(tokens, rates, sessionsPerDay = 1, workingDays = 22) {
  let sessions, days
  try { sessions = count(sessionsPerDay, 'sessionsPerDay'); days = count(workingDays, 'workingDays') }
  catch { throw new ToolError('schedule') }
  if (sessions < 1 || sessions > 1000 || days < 1 || days > 31) throw new ToolError('schedule')
  const rows = CATEGORIES.map(key => {
    const n = count(tokens[key], key), price = rate(rates[key], key)
    return { key, tokens: n, rate: price, cost: n / 1_000_000 * price }
  })
  const total = rows.reduce((a, b) => a + b.cost, 0)
  const monthly = total * sessions * days
  const tokenTotal = sumCounts(rows.map(row => row.tokens))
  if (!Number.isFinite(monthly)) throw new ToolError('overflow')
  return { rows, total, monthly, tokenTotal, sessionsPerDay: sessions, workingDays: days }
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
function logCount(value) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new ToolError('tokens')
  return value
}
function usageOf(u) {
  // Required base fields: missing usage must not masquerade as a measured zero.
  const input = logCount(u.input_tokens), output = logCount(u.output_tokens)
  const optional = value => value === undefined ? 0 : logCount(value)
  const cacheRead = optional(u.cache_read_input_tokens)
  const legacy = optional(u.cache_creation_input_tokens)
  if (u.cache_creation !== undefined && !object(u.cache_creation)) throw new ToolError('tokens')
  const split = u.cache_creation ?? {}
  const five = optional(split.ephemeral_5m_input_tokens), hour = optional(split.ephemeral_1h_input_tokens)
  const splitTotal = sumCounts([five, hour]), cacheWrite = Math.max(legacy, splitTotal)
  const total = sumCounts([input, output, cacheRead, cacheWrite])
  return { input, output, cacheRead, cacheWrite, total,
    inconsistent: u.cache_creation_input_tokens !== undefined && u.cache_creation !== undefined && legacy !== splitTotal }
}
export function countClaudeUsage(text) {
  if (typeof text !== 'string') throw new ToolError('format')
  if (text.length > MAX_BYTES || new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new ToolError('size')
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop() // A final newline terminates a line, not an extra record.
  if (lines.length > MAX_LINES) throw new ToolError('lines')
  const records = new Map()
  const diagnostics = { duplicates: 0, missingIds: 0, missingUsage: 0, invalidUsage: 0, malformedLines: 0, ignoredLines: 0, inconsistentCache: 0 }
  let anonymous = 0
  for (const line of lines) {
    if (!line.trim()) continue
    let entry
    try { entry = JSON.parse(line) } catch { diagnostics.malformedLines++; continue }
    if (!object(entry) || entry.type !== 'assistant' || !object(entry.message)) { diagnostics.ignoredLines++; continue }
    if (!object(entry.message.usage)) { diagnostics.missingUsage++; continue }
    let usage
    try { usage = usageOf(entry.message.usage) } catch { diagnostics.invalidUsage++; continue }
    const id = typeof entry.message.id === 'string' && entry.message.id.length > 0 ? entry.message.id : undefined
    const key = id === undefined ? `anonymous:${anonymous++}` : `id:${id}`
    if (id === undefined) diagnostics.missingIds++
    const existing = records.get(key)
    if (existing !== undefined) {
      diagnostics.duplicates++
      // A whole recorded snapshot, not synthetic per-field maxima; same as the
      // desktop's within-turn streaming policy, but applied to this one input.
      if (usage.total >= existing.total) records.set(key, usage)
    } else records.set(key, usage)
  }
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  for (const record of records.values()) {
    for (const key of Object.keys(usage)) usage[key] = sumCounts([usage[key], record[key]])
    if (record.inconsistent) diagnostics.inconsistentCache++
  }
  // Only token numbers/diagnostics leave this function. Never expose message
  // content, tool arguments, file paths, credentials or message IDs.
  return { usage, records: records.size, diagnostics }
}
export const EXAMPLE_JSONL = [
  { type: 'assistant', message: { id: 'public-example-1', usage: { input_tokens: 0, output_tokens: 0 } } },
  { type: 'assistant', message: { id: 'public-example-1', usage: { input_tokens: 100, output_tokens: 40, cache_read_input_tokens: 1000, cache_creation_input_tokens: 300, cache_creation: { ephemeral_5m_input_tokens: 200, ephemeral_1h_input_tokens: 100 } } } },
  { type: 'assistant', message: { id: 'public-example-2', usage: { input_tokens: 50, output_tokens: 20, cache_read_input_tokens: 200 } } },
].map(row => JSON.stringify(row)).join('\n')
