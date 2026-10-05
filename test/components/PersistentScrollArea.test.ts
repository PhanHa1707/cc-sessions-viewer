import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import PersistentScrollArea from '../../src/components/PersistentScrollArea.vue'

enableAutoUnmount(afterEach)

function setDimension(element: HTMLElement, key: 'clientWidth' | 'clientHeight' | 'scrollWidth' | 'scrollHeight', value: number) {
  Object.defineProperty(element, key, { configurable: true, value })
}

describe('PersistentScrollArea', () => {
  it('keeps custom horizontal and vertical scrollbars visible when content overflows', async () => {
    const wrapper = mount(PersistentScrollArea, {
      slots: { default: '<div class="long-content">content</div>' },
    })
    const viewport = wrapper.get('.persistent-scroll-viewport').element as HTMLElement
    setDimension(viewport, 'clientWidth', 240)
    setDimension(viewport, 'scrollWidth', 900)
    setDimension(viewport, 'clientHeight', 180)
    setDimension(viewport, 'scrollHeight', 1200)

    await wrapper.get('.persistent-scroll-viewport').trigger('scroll')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[aria-orientation="horizontal"]').exists()).toBe(true)
    expect(wrapper.get('[aria-orientation="vertical"]').exists()).toBe(true)
    expect(wrapper.get('[aria-orientation="horizontal"]').attributes('aria-valuemax')).toBe('660')
    expect(wrapper.get('[aria-orientation="vertical"]').attributes('aria-valuemax')).toBe('1020')
  })

  it('scrolls content when the visible scrollbar thumb is dragged', async () => {
    const wrapper = mount(PersistentScrollArea, {
      slots: { default: '<div class="long-content">content</div>' },
    })
    const viewport = wrapper.get('.persistent-scroll-viewport').element as HTMLElement
    setDimension(viewport, 'clientWidth', 240)
    setDimension(viewport, 'scrollWidth', 240)
    setDimension(viewport, 'clientHeight', 180)
    setDimension(viewport, 'scrollHeight', 1200)
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, writable: true, value: 0 })

    await wrapper.get('.persistent-scroll-viewport').trigger('scroll')
    await wrapper.vm.$nextTick()
    const track = wrapper.get('.persistent-scroll-track.vertical').element as HTMLElement
    const thumb = wrapper.get('.persistent-scroll-thumb').element as HTMLElement
    setDimension(track, 'clientHeight', 200)
    Object.defineProperty(thumb, 'offsetHeight', { configurable: true, value: 40 })
    track.getBoundingClientRect = () => ({
      x: 0, y: 0, top: 0, left: 0, right: 9, bottom: 200, width: 9, height: 200,
      toJSON: () => ({}),
    })
    thumb.getBoundingClientRect = () => ({
      x: 0, y: 0, top: 0, left: 0, right: 9, bottom: 40, width: 9, height: 40,
      toJSON: () => ({}),
    })

    thumb.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: 10 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientY: 80 }))
    window.dispatchEvent(new MouseEvent('pointerup'))

    expect(viewport.scrollTop).toBeGreaterThan(0)
  })

  it('supports keyboard scrolling through the visible scrollbar', async () => {
    const wrapper = mount(PersistentScrollArea, {
      slots: { default: '<div class="long-content">content</div>' },
    })
    const viewport = wrapper.get('.persistent-scroll-viewport').element as HTMLElement
    setDimension(viewport, 'clientWidth', 240)
    setDimension(viewport, 'scrollWidth', 240)
    setDimension(viewport, 'clientHeight', 180)
    setDimension(viewport, 'scrollHeight', 1200)
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, writable: true, value: 0 })

    await wrapper.get('.persistent-scroll-viewport').trigger('scroll')
    await wrapper.vm.$nextTick()
    await wrapper.get('[aria-orientation="vertical"]').trigger('keydown', { key: 'ArrowDown' })

    expect(viewport.scrollTop).toBe(40)
  })
})
