import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { auditUtility } from '../utility-audit.mjs'
import { CATEGORIES, MODELS, PRICING_CHECKED, PRICING_SOURCE } from '../../.vitepress/theme/lib/usage-tools.mjs'
const document = body => new JSDOM(`<main class="vp-doc">${body}</main>`).window.document
const field = (id, extra = '') => `<label for="${id}">Field</label><input id="${id}" ${extra}>`
const submit = '<button type="submit">Calculate</button>'
const rates = `<table><tbody>${MODELS.map(model=>'<tr><th>'+model.name+'</th>'+CATEGORIES.map(key=>'<td>'+model.rates[key]+'</td>').join('')+'</tr>').join('')}</tbody></table>`
const calculator = `<section class="sv-utility"><form><label for="model">Model</label><select id="model">${[...MODELS.map(model=>model.id),'custom'].map(id=>`<option value="${id}">${id}</option>`).join('')}</select>${CATEGORIES.map(key=>field('v-'+key)+field('v-rate-'+key)).join('')}${submit}</form></section>${rates}<p>${PRICING_CHECKED}</p><a href="${PRICING_SOURCE}">Pricing</a>`
const counter = `<section class="sv-utility"><form>${field('file','type="file" accept=".jsonl"')}<label for="jsonl">JSONL</label><textarea id="jsonl" spellcheck="false" autocomplete="off"></textarea>${submit}</form></section>`
test('utility audit accepts cold SSR controls and registry rates in all languages', () => {
  for(const prefix of ['', 'zh/', 'ja/']) {
    assert.deepEqual(auditUtility(document(calculator),prefix+'tools/claude-code-cost-calculator.md'),[])
    assert.deepEqual(auditUtility(document(counter),prefix+'tools/claude-code-token-counter.md'),[])
  }
})
test('utility audit rejects missing renderer/labels/category and unknown presets', () => {
  const path='tools/claude-code-cost-calculator.md'
  assert.ok(auditUtility(document('text only'),path).includes('utility missing from static HTML'))
  const doc=document(calculator)
  doc.querySelector('input[id="v-input"]').remove()
  doc.querySelector('label[for="model"]').remove()
  doc.querySelector('select').innerHTML+='<option value="unknown">Unknown</option>'
  const errors=auditUtility(doc,path)
  for(const error of ['missing token field input','utility input has no visible associated label','missing or unsupported pricing preset'])assert.ok(errors.includes(error))
})
test('utility audit rejects changed table, missing source/date and misleading cold results', () => {
  const doc=document(calculator.replace(PRICING_CHECKED,'old date').replace(PRICING_SOURCE,'https://wrong.example'))
  doc.querySelector('td').textContent='999'
  doc.querySelector('.sv-utility').innerHTML+='<span data-summary-cost>$0</span>'
  const errors=auditUtility(doc,'zh/tools/claude-code-cost-calculator.md')
  for(const pattern of ['rendered rates differ','pricing review date missing','official pricing source missing','stale SSR estimate'])assert.ok(errors.some(error=>error.includes(pattern)))
})
test('utility audit checks local file/textarea without auditing unrelated docs', () => {
  const doc=document(counter)
  doc.querySelector('textarea').remove();doc.querySelector('input').remove()
  doc.querySelector('.sv-utility').innerHTML+='<span data-total-tokens>0</span>'
  const errors=auditUtility(doc,'ja/tools/claude-code-token-counter.md')
  assert.ok(errors.includes('local JSONL input missing') && errors.includes('local file control missing'))
  assert.ok(errors.some(error=>error.includes('zero/stale')))
  assert.deepEqual(auditUtility(document('ordinary article'),'features/stats.md'),[])
})
