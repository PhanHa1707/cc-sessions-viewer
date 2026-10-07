export type Category = 'input' | 'output' | 'cacheRead' | 'cacheWrite5m' | 'cacheWrite1h'
export type Values = Record<Category, number | string>
export interface CostResult { rows: { key: Category; tokens: number; rate: number; cost: number }[]; total: number; monthly: number; tokenTotal: number; sessionsPerDay: number; workingDays: number }
export interface UsageResult { usage: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number }; records: number; diagnostics: { duplicates: number; missingIds: number; missingUsage: number; invalidUsage: number; malformedLines: number; ignoredLines: number; inconsistentCache: number } }
export const PRICING_CHECKED: string
export const PRICING_SOURCE: string
export const CATEGORIES: readonly Category[]
export const MODELS: readonly { id: string; name: string; rates: Readonly<Record<Category, number>> }[]
export const MAX_BYTES: number
export const MAX_LINES: number
export const EXAMPLE_JSONL: string
export class ToolError extends Error { code: string; field: string; constructor(code: string, field?: string) }
export function calculateCost(tokens: Values, rates: Values, sessionsPerDay?: number | string, workingDays?: number | string): CostResult
export function countClaudeUsage(text: string): UsageResult
