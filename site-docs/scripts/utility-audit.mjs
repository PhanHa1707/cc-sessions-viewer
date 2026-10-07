import { CATEGORIES, MODELS, PRICING_CHECKED, PRICING_SOURCE } from '../.vitepress/theme/lib/usage-tools.mjs'

// The generic SEO audit cannot prove the utility SSR rendered its form/rates.
export function auditUtility(document, relativePath) {
  const route = relativePath.match(/^(?:(zh|ja)\/)?tools\/claude-code-(cost-calculator|token-counter)\.md$/)
  if (route === null) return []
  const errors = [], check = (condition, message) => { if (!condition) errors.push(message) }
  const widget = document.querySelector('.vp-doc .sv-utility')
  if (widget === null) return ['utility missing from static HTML']
  check(Boolean(widget.querySelector('form button[type="submit"]')?.textContent.trim()), 'utility submit control missing')
  for (const field of widget.querySelectorAll('input, select, textarea')) {
    const label = [...widget.querySelectorAll('label')].find(label => label.getAttribute('for') === field.id)
    check(Boolean(field.id && label?.textContent.trim()), 'utility input has no visible associated label')
  }
  if (route[2] === 'cost-calculator') {
    const options = [...widget.querySelectorAll('select option')].map(option => option.getAttribute('value'))
    check(JSON.stringify(options) === JSON.stringify([...MODELS.map(model => model.id), 'custom']), 'missing or unsupported pricing preset')
    for (const key of CATEGORIES) {
      check(Boolean(widget.querySelector(`input:not([id*="-rate-"])[id$="-${key}"]`)), `missing token field ${key}`)
      check(Boolean(widget.querySelector(`input[id$="-rate-${key}"]`)), `missing rate field ${key}`)
    }
    const tables = [...document.querySelectorAll('.vp-doc table')]
    const table = tables.find(table => table.querySelector('tbody th')?.textContent.trim() === MODELS[0].name)
    const rows = [...(table?.querySelectorAll('tbody tr') ?? [])]
    check(rows.length === MODELS.length, 'reviewed rates table missing from static HTML')
    for (const [i, model] of MODELS.entries()) {
      const row = rows[i]
      check(row?.querySelector('th')?.textContent.trim() === model.name, `rate model missing ${model.name}`)
      const actual = [...(row?.querySelectorAll('td') ?? [])].map(cell => Number(cell.textContent.trim()))
      check(JSON.stringify(actual) === JSON.stringify(CATEGORIES.map(key => model.rates[key])), `rendered rates differ ${model.name}`)
    }
    check(document.querySelector('.vp-doc')?.textContent.includes(PRICING_CHECKED), 'pricing review date missing')
    check([...document.querySelectorAll('.vp-doc a')].some(link => link.getAttribute('href') === PRICING_SOURCE), 'official pricing source missing')
    check(widget.querySelector('[data-summary-cost]') === null, 'unsubmitted calculator presents a stale SSR estimate')
  } else {
    check(Boolean(widget.querySelector('textarea[spellcheck="false"][autocomplete="off"]')), 'local JSONL input missing')
    check(Boolean(widget.querySelector('input[type="file"][accept*=".jsonl"]')), 'local file control missing')
    check(widget.querySelector('[data-total-tokens]') === null, 'unmeasured counter presents a zero/stale SSR total')
  }
  return errors
}
