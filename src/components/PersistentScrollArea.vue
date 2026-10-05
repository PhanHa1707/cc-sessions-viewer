<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { t } from '../i18n'

type Axis = 'horizontal' | 'vertical'

const viewport = ref<HTMLElement | null>(null)
const horizontalTrack = ref<HTMLElement | null>(null)
const verticalTrack = ref<HTMLElement | null>(null)
const horizontalThumb = ref<HTMLElement | null>(null)
const verticalThumb = ref<HTMLElement | null>(null)
const canScroll = reactive({ horizontal: false, vertical: false })
const bar = reactive({
  horizontal: { thumb: 0, offset: 0, max: 0, value: 0 },
  vertical: { thumb: 0, offset: 0, max: 0, value: 0 },
})
let resizeObserver: ResizeObserver | null = null
let drag: { axis: Axis; startPointer: number; startScroll: number } | null = null

function metricsFor(axis: Axis) {
  return axis === 'horizontal' ? bar.horizontal : bar.vertical
}

function trackFor(axis: Axis) {
  return axis === 'horizontal' ? horizontalTrack.value : verticalTrack.value
}

function thumbFor(axis: Axis) {
  return axis === 'horizontal' ? horizontalThumb.value : verticalThumb.value
}

function syncScrollbars() {
  const el = viewport.value
  if (!el) return

  canScroll.horizontal = el.scrollWidth > el.clientWidth + 1
  canScroll.vertical = el.scrollHeight > el.clientHeight + 1

  void nextTick(() => {
    if (!viewport.value) return
    updateAxis('horizontal')
    updateAxis('vertical')
  })
}

function updateAxis(axis: Axis) {
  const el = viewport.value
  const track = trackFor(axis)
  const metrics = metricsFor(axis)
  if (!el || !track) return

  const viewportSize = axis === 'horizontal' ? el.clientWidth : el.clientHeight
  const contentSize = axis === 'horizontal' ? el.scrollWidth : el.scrollHeight
  const scrollRange = Math.max(0, contentSize - viewportSize)
  const trackSize = axis === 'horizontal' ? track.clientWidth : track.clientHeight
  const thumbSize = contentSize > 0
    ? Math.min(trackSize, Math.max(24, trackSize * viewportSize / contentSize))
    : trackSize
  const travel = Math.max(0, trackSize - thumbSize)
  const scrollPosition = axis === 'horizontal' ? el.scrollLeft : el.scrollTop

  metrics.thumb = thumbSize
  metrics.max = scrollRange
  metrics.value = scrollPosition
  metrics.offset = scrollRange > 0 ? travel * scrollPosition / scrollRange : 0
}

function onScroll() {
  syncScrollbars()
}

function pointerPosition(axis: Axis, event: PointerEvent): number {
  return axis === 'horizontal' ? event.clientX : event.clientY
}

function scrollTo(axis: Axis, value: number) {
  const el = viewport.value
  if (!el) return
  if (axis === 'horizontal') el.scrollLeft = value
  else el.scrollTop = value
}

function beginDrag(axis: Axis, event: PointerEvent) {
  if (event.button !== 0) return
  const track = trackFor(axis)
  const thumb = thumbFor(axis)
  const el = viewport.value
  if (!track || !thumb || !el) return

  event.preventDefault()
  const coordinate = pointerPosition(axis, event)
  const trackRect = track.getBoundingClientRect()
  const thumbRect = thumb.getBoundingClientRect()
  const trackStart = axis === 'horizontal' ? trackRect.left : trackRect.top
  const thumbSize = axis === 'horizontal' ? thumbRect.width : thumbRect.height
  const withinThumb = event.target instanceof Element && event.target.closest('.persistent-scroll-thumb') !== null

  if (!withinThumb) {
    const trackPosition = coordinate - trackStart
    const travel = Math.max(1, (axis === 'horizontal' ? track.clientWidth : track.clientHeight) - thumbSize)
    const ratio = Math.max(0, Math.min(1, (trackPosition - thumbSize / 2) / travel))
    scrollTo(axis, ratio * metricsFor(axis).max)
    syncScrollbars()
    drag = { axis, startPointer: coordinate, startScroll: axis === 'horizontal' ? el.scrollLeft : el.scrollTop }
  } else {
    drag = {
      axis,
      startPointer: coordinate,
      startScroll: axis === 'horizontal' ? el.scrollLeft : el.scrollTop,
    }
  }

  document.body.classList.add('persistent-scroll-dragging')
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}

function onPointerMove(event: PointerEvent) {
  if (!drag) return
  const track = trackFor(drag.axis)
  const thumb = thumbFor(drag.axis)
  if (!track || !thumb) return

  const coordinate = pointerPosition(drag.axis, event)
  const trackSize = drag.axis === 'horizontal' ? track.clientWidth : track.clientHeight
  const thumbSize = drag.axis === 'horizontal' ? thumb.offsetWidth : thumb.offsetHeight
  const travel = Math.max(1, trackSize - thumbSize)
  const scrollRange = metricsFor(drag.axis).max
  const el = viewport.value
  if (!el) return

  scrollTo(drag.axis, travel > 0 ? drag.startScroll + (coordinate - drag.startPointer) * scrollRange / travel : 0)
  // Clamp after mapping; this also handles moving the pointer beyond either end of the track.
  if (drag.axis === 'horizontal') el.scrollLeft = Math.max(0, Math.min(scrollRange, el.scrollLeft))
  else el.scrollTop = Math.max(0, Math.min(scrollRange, el.scrollTop))
}

function stopDrag() {
  drag = null
  document.body.classList.remove('persistent-scroll-dragging')
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

function onKeydown(axis: Axis, event: KeyboardEvent) {
  const el = viewport.value
  if (!el) return
  const current = axis === 'horizontal' ? el.scrollLeft : el.scrollTop
  const viewportSize = axis === 'horizontal' ? el.clientWidth : el.clientHeight
  let next: number | null = null
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = metricsFor(axis).max
  else if (axis === 'horizontal' && event.key === 'ArrowLeft') next = current - 40
  else if (axis === 'horizontal' && event.key === 'ArrowRight') next = current + 40
  else if (axis === 'vertical' && event.key === 'ArrowUp') next = current - 40
  else if (axis === 'vertical' && event.key === 'ArrowDown') next = current + 40
  else if (event.key === 'PageUp') next = current - viewportSize * 0.9
  else if (event.key === 'PageDown') next = current + viewportSize * 0.9
  if (next === null) return
  event.preventDefault()
  scrollTo(axis, Math.max(0, Math.min(metricsFor(axis).max, next)))
}

onMounted(async () => {
  await nextTick()
  syncScrollbars()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncScrollbars)
    if (viewport.value) resizeObserver.observe(viewport.value)
    const content = viewport.value?.firstElementChild
    if (content) resizeObserver.observe(content)
  }
  window.addEventListener('resize', syncScrollbars)
})

onBeforeUnmount(() => {
  stopDrag()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', syncScrollbars)
})
</script>

<template>
  <div class="persistent-scroll-area">
    <div ref="viewport" class="persistent-scroll-viewport" @scroll.passive="onScroll">
      <div class="persistent-scroll-content"><slot /></div>
    </div>
    <div
      v-if="canScroll.vertical"
      ref="verticalTrack"
      class="persistent-scroll-track vertical"
      :class="{ 'with-horizontal': canScroll.horizontal }"
      role="scrollbar"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="t('git.scrollVertical')"
      :aria-valuemin="0"
      :aria-valuemax="bar.vertical.max"
      :aria-valuenow="bar.vertical.value"
      @pointerdown="beginDrag('vertical', $event)"
      @keydown="onKeydown('vertical', $event)"
    >
      <div ref="verticalThumb" class="persistent-scroll-thumb" :style="{ height: `${bar.vertical.thumb}px`, transform: `translateY(${bar.vertical.offset}px)` }" />
    </div>
    <div
      v-if="canScroll.horizontal"
      ref="horizontalTrack"
      class="persistent-scroll-track horizontal"
      :class="{ 'with-vertical': canScroll.vertical }"
      role="scrollbar"
      tabindex="0"
      aria-orientation="horizontal"
      :aria-label="t('git.scrollHorizontal')"
      :aria-valuemin="0"
      :aria-valuemax="bar.horizontal.max"
      :aria-valuenow="bar.horizontal.value"
      @pointerdown="beginDrag('horizontal', $event)"
      @keydown="onKeydown('horizontal', $event)"
    >
      <div ref="horizontalThumb" class="persistent-scroll-thumb" :style="{ width: `${bar.horizontal.thumb}px`, transform: `translateX(${bar.horizontal.offset}px)` }" />
    </div>
  </div>
</template>

<style scoped>
.persistent-scroll-area {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.persistent-scroll-viewport {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
}
.persistent-scroll-viewport::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
.persistent-scroll-content {
  width: max-content;
  min-width: 100%;
  min-height: 100%;
}
.persistent-scroll-track {
  position: absolute;
  z-index: 4;
  display: block;
  border: 1px solid color-mix(in srgb, var(--border-strong) 60%, transparent);
  border-radius: 7px;
  background: color-mix(in srgb, var(--surface) 82%, var(--text) 18%);
  outline: none;
  touch-action: none;
}
.persistent-scroll-track.vertical {
  top: 2px;
  right: 2px;
  bottom: 12px;
  width: 9px;
}
.persistent-scroll-track.vertical.with-horizontal {
  bottom: 13px;
}
.persistent-scroll-track.horizontal {
  right: 12px;
  bottom: 2px;
  left: 2px;
  height: 9px;
}
.persistent-scroll-track.horizontal.with-vertical {
  right: 13px;
}
.persistent-scroll-thumb {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 24px;
  min-height: 24px;
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--text-secondary) 78%, var(--surface) 22%);
  box-shadow: 0 1px 3px color-mix(in srgb, #000 25%, transparent);
  cursor: grab;
}
.persistent-scroll-track.vertical .persistent-scroll-thumb {
  right: 0;
  min-width: 0;
}
.persistent-scroll-track.horizontal .persistent-scroll-thumb {
  bottom: 0;
  min-height: 0;
}
.persistent-scroll-track:hover .persistent-scroll-thumb,
.persistent-scroll-track:focus-visible .persistent-scroll-thumb {
  background: var(--accent);
}
.persistent-scroll-track:active .persistent-scroll-thumb {
  cursor: grabbing;
}
</style>
