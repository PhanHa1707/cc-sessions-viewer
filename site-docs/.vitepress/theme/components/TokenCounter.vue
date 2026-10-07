<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { countClaudeUsage, EXAMPLE_JSONL, MAX_BYTES, ToolError, type UsageResult } from '../lib/usage-tools.mjs'
import { utilityCopy, type UtilityLocale } from '../lib/utility-copy'
import './utility.css'
const props = withDefaults(defineProps<{ locale?: UtilityLocale }>(), { locale: 'en' })
const t = computed(() => utilityCopy[props.locale])
const id = useId(), input = ref(''), loading = ref(false), error = ref('')
const result = ref<UsageResult | null>(null), errorSummary = ref<HTMLParagraphElement | null>(null), fileInput = ref<HTMLInputElement | null>(null)
let generation = 0
const integer = (value: number) => new Intl.NumberFormat(t.value.lang).format(value)
function invalidate() { generation++; loading.value = false; error.value = ''; result.value = null }
async function fail(err: unknown) {
  const code = err instanceof ToolError ? err.code as keyof typeof utilityCopy.en.errors : 'file'
  error.value = t.value.errors[code] ?? t.value.errors.format
  await nextTick(); errorSummary.value?.focus()
}
async function count() {
  invalidate()
  try {
    result.value = countClaudeUsage(input.value)
    if (result.value.records === 0) await fail(new ToolError('format'))
  } catch (err) { await fail(err) }
}
function reset() { invalidate(); input.value = ''; if (fileInput.value !== null) fileInput.value.value = '' }
function example() { invalidate(); input.value = EXAMPLE_JSONL; void count() }
async function readFile(event: Event) {
  const control = event.target as HTMLInputElement, file = control.files?.[0]
  invalidate(); input.value = ''; control.value = ''
  if (file === undefined) return
  const current = generation
  if (file.size > MAX_BYTES) { await fail(new ToolError('size')); return }
  loading.value = true
  try {
    const text = await file.text()
    if (generation !== current) return
    input.value = text; loading.value = false; await count()
  } catch {
    if (generation !== current) return
    loading.value = false; await fail(new ToolError('file'))
  }
}
</script>

<template>
  <section class="sv-utility" :aria-label="t.counterResult">
    <p class="sv-note">{{ t.local }}</p>
    <form novalidate @submit.prevent="count">
      <label :for="`${id}-file`">{{ t.file }}</label>
      <input :id="`${id}-file`" ref="fileInput" type="file" accept=".jsonl,.ndjson,application/x-ndjson" @change="readFile" />
      <label :for="`${id}-jsonl`">{{ t.jsonl }}</label>
      <textarea :id="`${id}-jsonl`" v-model="input" rows="8" spellcheck="false" autocapitalize="off" autocomplete="off" :aria-describedby="`${id}-format`" @input="invalidate" />
      <p :id="`${id}-format`" class="sv-note">{{ t.counterBoundary }}</p>
      <p v-if="loading" role="status">{{ t.reading }}</p>
      <p v-if="error" :id="`${id}-error`" ref="errorSummary" class="sv-error" role="alert" tabindex="-1">{{ error }}</p>
      <div class="sv-actions"><button type="submit" class="sv-primary" :disabled="loading">{{ t.count }}</button><button type="button" @click="example">{{ t.example }}</button><button type="button" @click="reset">{{ t.reset }}</button></div>
    </form>
    <div v-if="result && result.records > 0" class="sv-result" role="status" aria-live="polite" aria-atomic="true">
      <p><strong>{{ t.counterResult }}</strong></p>
      <dl class="sv-totals"><div><dt>{{ t.totalTokens }}</dt><dd data-total-tokens>{{ integer(result.usage.total) }}</dd></div><div><dt>{{ t.records }}</dt><dd>{{ integer(result.records) }}</dd></div></dl>
      <dl class="sv-diagnostics"><div><dt>{{ t.categories.input }}</dt><dd>{{ integer(result.usage.input) }}</dd></div><div><dt>{{ t.categories.output }}</dt><dd>{{ integer(result.usage.output) }}</dd></div><div><dt>{{ t.categories.cacheRead }}</dt><dd>{{ integer(result.usage.cacheRead) }}</dd></div><div><dt>{{ t.cacheWrite }}</dt><dd>{{ integer(result.usage.cacheWrite) }}</dd></div></dl>
    </div>
    <details v-if="result" open class="sv-coverage">
      <summary>{{ t.diagnostics }}</summary>
      <dl class="sv-diagnostics"><div v-for="(value, key) in result.diagnostics" :key="key"><dt>{{ t[key] }}</dt><dd>{{ integer(value) }}</dd></div></dl>
    </details>
  </section>
</template>
