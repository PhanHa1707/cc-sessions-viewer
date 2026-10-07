import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import CostCalculator from '../site-docs/.vitepress/theme/components/CostCalculator.vue'
import TokenCounter from '../site-docs/.vitepress/theme/components/TokenCounter.vue'
import PricingTable from '../site-docs/.vitepress/theme/components/PricingTable.vue'
import { EXAMPLE_JSONL, MAX_BYTES } from '../site-docs/.vitepress/theme/lib/usage-tools.mjs'
const mounted: VueWrapper[] = []
function keep(wrapper: VueWrapper) { mounted.push(wrapper); return wrapper }
afterEach(() => { for (const wrapper of mounted.splice(0)) wrapper.unmount(); document.body.innerHTML = '' })
async function button(wrapper: VueWrapper, text: string) {
  const target = wrapper.findAll('button').find(item => item.text() === text)
  if (target === undefined) throw new Error('Missing button '+text)
  await target.trigger('click'); await flushPromises()
}
async function file(wrapper: VueWrapper, value: { size: number; text: () => Promise<string> }) {
  const control = wrapper.get('input[type=file]')
  Object.defineProperty(control.element, 'files', { value: [value], configurable: true })
  await control.trigger('change'); await flushPromises()
}

describe('documentation cost calculator', () => {
  it('runs the public example, resets and invalidates stale result on edits', async () => {
    const wrapper = keep(mount(CostCalculator))
    expect(wrapper.find('[data-summary-cost]').exists()).toBe(false)
    await button(wrapper,'Try public example')
    expect(wrapper.get('[data-summary-cost]').text()).toBe('$0.155')
    expect(wrapper.get('[data-monthly-cost]').text()).toBe('$13.64')
    await wrapper.get('input[id$="-input"]').setValue(99)
    expect(wrapper.find('[data-summary-cost]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.find('[data-summary-cost]').exists()).toBe(true)
    await button(wrapper,'Reset')
    expect(wrapper.find('[data-summary-cost]').exists()).toBe(false)
    expect((wrapper.get('input[id$="-input"]').element as HTMLInputElement).value).toBe('0')
  })
  it('supports explicit presets and marks edited prices custom without guessed fallback', async () => {
    const wrapper = keep(mount(CostCalculator))
    await wrapper.get('select').setValue('opus-5-5')
    expect((wrapper.get('input[id$="-rate-cacheRead"]').element as HTMLInputElement).value).toBe('0.2')
    await wrapper.get('input[id$="-rate-input"]').setValue(7)
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('custom')
    expect(wrapper.text()).toContain('not verified list prices')
    await wrapper.get('select').setValue('haiku-4-5')
    expect((wrapper.get('input[id$="-rate-input"]').element as HTMLInputElement).value).toBe('1')
    expect(wrapper.text()).not.toContain('not verified list prices')
  })
  it('shows and focuses validation, does not present invalid inputs as zero', async () => {
    const wrapper = keep(mount(CostCalculator,{attachTo:document.body}))
    await wrapper.get('input[id$="-input"]').setValue('')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Empty fields are not zero')
    expect(document.activeElement).toBe(wrapper.get('[role=alert]').element)
    expect(wrapper.find('[data-summary-cost]').exists()).toBe(false)
    expect(wrapper.get('input[id$="-input"]').attributes('aria-invalid')).toBe('true')
  })
  it('labels positive sub-micro-dollar estimates without rounding them to zero', async () => {
    const wrapper = keep(mount(CostCalculator))
    await wrapper.get('input[id$="-input"]').setValue(1)
    await wrapper.get('input[id$="-rate-input"]').setValue(.0001)
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[data-summary-cost]').text()).toBe('<$0.000001')
  })
})
describe('documentation recorded-usage counter', () => {
  it('counts the synthetic example, never renders input as HTML, clears stale results', async () => {
    const wrapper = keep(mount(TokenCounter))
    await button(wrapper,'Try public example')
    expect(wrapper.get('[data-total-tokens]').text()).toBe('1,710')
    await wrapper.get('textarea').setValue(EXAMPLE_JSONL+'\nnot json')
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[data-total-tokens]').text()).toBe('1,710')
    await button(wrapper,'Reset')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
  })
  it('rejects prompt text/empty usage with diagnostics, not a measured zero', async () => {
    const wrapper = keep(mount(TokenCounter))
    await wrapper.get('textarea').setValue('{"type":"assistant","message":{"content":"<script>secret</script>"}}')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('No usable')
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('.sv-coverage').text()).toContain('Assistant rows missing usage')
  })
  it('reads a selected public file locally and rejects oversized files before reading', async () => {
    const wrapper = keep(mount(TokenCounter)), read = vi.fn().mockResolvedValue(EXAMPLE_JSONL)
    await file(wrapper,{size:EXAMPLE_JSONL.length,text:read})
    expect(read).toHaveBeenCalledOnce(); expect(wrapper.get('[data-total-tokens]').text()).toBe('1,710')
    const oversized = vi.fn()
    await file(wrapper,{size:MAX_BYTES+1,text:oversized})
    expect(oversized).not.toHaveBeenCalled(); expect(wrapper.get('[role=alert]').text()).toContain('5 MiB')
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
  })
  it('clears previous results on read failure', async () => {
    const wrapper = keep(mount(TokenCounter))
    await button(wrapper,'Try public example')
    await file(wrapper,{size:10,text:vi.fn().mockRejectedValue(new Error('private file path'))})
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
    expect(wrapper.get('[role=alert]').text()).toContain('Could not read')
    expect(wrapper.text()).not.toContain('private file path')
  })
  it('ignores late file completion after reset or manual edit', async () => {
    const wrapper = keep(mount(TokenCounter))
    let finish!: (value: string) => void
    await file(wrapper,{size:10,text:() => new Promise<string>(resolve => {finish=resolve})})
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
    await button(wrapper,'Reset'); finish(EXAMPLE_JSONL); await flushPromises()
    expect(wrapper.find('[data-total-tokens]').exists()).toBe(false)
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
    await file(wrapper,{size:10,text:() => new Promise<string>(resolve => {finish=resolve})})
    await wrapper.get('textarea').setValue('manual edit'); finish(EXAMPLE_JSONL); await flushPromises()
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('manual edit')
  })
})
for (const locale of ['en','zh','ja'] as const) it(`${locale} has localized labels, result regions and SSR price table`, async () => {
  const calculator = keep(mount(CostCalculator,{props:{locale}})), counter = keep(mount(TokenCounter,{props:{locale}})), prices = keep(mount(PricingTable,{props:{locale}}))
  expect(calculator.findAll('label')).toHaveLength(13)
  expect(counter.findAll('label')).toHaveLength(2)
  expect(prices.findAll('tbody tr')).toHaveLength(7)
  for (const wrapper of [calculator,counter]) {
    for (const label of wrapper.findAll('label')) expect(wrapper.find('[id="'+label.attributes('for')+'"]').exists()).toBe(true)
    await wrapper.findAll('button')[1].trigger('click'); await flushPromises()
    expect(wrapper.get('[role=status]').attributes('aria-atomic')).toBe('true')
  }
})
