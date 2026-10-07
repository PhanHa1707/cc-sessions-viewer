<script setup lang="ts">
import { computed, nextTick, reactive, ref, useId } from 'vue'
import { calculateCost, CATEGORIES, MODELS, PRICING_CHECKED, PRICING_SOURCE, ToolError, type CostResult, type Values } from '../lib/usage-tools.mjs'
import { utilityCopy, type UtilityLocale } from '../lib/utility-copy'
import './utility.css'
const props = withDefaults(defineProps<{ locale?: UtilityLocale }>(), { locale: 'en' })
const t = computed(() => utilityCopy[props.locale])
const id = useId()
const selected = ref(MODELS[0].id)
const tokens = reactive<Values>({ input: 0, output: 0, cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0 })
const rates = reactive<Values>({ ...MODELS[0].rates })
const sessions = ref<number | string>(1), days = ref<number | string>(22)
const result = ref<CostResult | null>(null), error = ref(''), errorSummary = ref<HTMLParagraphElement | null>(null)
const invalid = ref(''), advanced = ref(false)
const money = (value: number) => {
  const format = (n: number) => new Intl.NumberFormat(t.value.lang, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n)
  return value > 0 && value < 0.000001 ? `<${format(0.000001)}` : format(value)
}
const integer = (value: number) => new Intl.NumberFormat(t.value.lang).format(value)
function invalidate() { result.value = null; error.value = ''; invalid.value = '' }
function chooseModel() {
  invalidate()
  const model = MODELS.find(item => item.id === selected.value)
  if (model !== undefined) Object.assign(rates, model.rates)
  else { selected.value = 'custom'; advanced.value = true }
}
function changeRate() { selected.value = 'custom'; invalidate() }
async function calculate() {
  invalidate()
  try { result.value = calculateCost(tokens, rates, sessions.value, days.value) }
  catch (err) {
    const code = err instanceof ToolError ? err.code as keyof typeof utilityCopy.en.errors : 'tokens'
    error.value = t.value.errors[code] ?? t.value.errors.tokens
    if (err instanceof ToolError) {
      invalid.value = err.code === 'rates' ? `rate-${err.field}` : err.field
      if (err.code === 'rates') advanced.value = true
    }
    await nextTick(); errorSummary.value?.focus()
  }
}
function reset() {
  invalidate(); selected.value = MODELS[0].id; Object.assign(rates, MODELS[0].rates)
  for (const key of CATEGORIES) tokens[key] = 0
  sessions.value = 1; days.value = 22; advanced.value = false
}
function example() {
  reset(); Object.assign(tokens, { input: 10000, output: 5000, cacheRead: 300000, cacheWrite5m: 10000, cacheWrite1h: 0 })
  sessions.value = 4; void calculate()
}
</script>

<template>
  <section class="sv-utility" :aria-label="t.estimate">
    <p class="sv-note">{{ t.local }}</p>
    <form novalidate @submit.prevent="calculate">
      <label :for="`${id}-model`">{{ t.model }}</label>
      <select :id="`${id}-model`" v-model="selected" @change="chooseModel">
        <option v-for="model in MODELS" :key="model.id" :value="model.id">{{ model.name }}</option>
        <option value="custom">{{ t.custom }}</option>
      </select>
      <fieldset>
        <legend>{{ t.tokens }}</legend>
        <div class="sv-fields">
          <div v-for="key in CATEGORIES" :key="key">
            <label :for="`${id}-${key}`">{{ t.categories[key] }}</label>
            <input :id="`${id}-${key}`" v-model.number="tokens[key]" type="number" min="0" step="1" inputmode="numeric" :aria-invalid="invalid === key" :aria-describedby="invalid === key ? `${id}-error` : undefined" @input="invalidate" />
          </div>
        </div>
      </fieldset>
      <details :open="advanced">
        <summary>{{ t.rates }}</summary>
        <div class="sv-fields">
          <div v-for="key in CATEGORIES" :key="key">
            <label :for="`${id}-rate-${key}`">{{ t.categories[key] }} · USD/MTok</label>
            <input :id="`${id}-rate-${key}`" v-model.number="rates[key]" type="number" min="0" step="any" inputmode="decimal" :aria-invalid="invalid === `rate-${key}`" :aria-describedby="invalid === `rate-${key}` ? `${id}-error` : undefined" @input="changeRate" />
          </div>
        </div>
      </details>
      <p class="sv-note" v-if="selected === 'custom'">{{ t.customNotice }}</p>
      <p class="sv-note" v-else>{{ t.reviewed }}: {{ PRICING_CHECKED }} · <a :href="PRICING_SOURCE">{{ t.source }}</a></p>
      <fieldset>
        <legend>{{ t.schedule }}</legend>
        <div class="sv-fields">
          <div><label :for="`${id}-sessions`">{{ t.sessions }}</label><input :id="`${id}-sessions`" v-model.number="sessions" type="number" min="1" max="1000" step="1" @input="invalidate" /></div>
          <div><label :for="`${id}-days`">{{ t.days }}</label><input :id="`${id}-days`" v-model.number="days" type="number" min="1" max="31" step="1" @input="invalidate" /></div>
        </div>
      </fieldset>
      <p v-if="error" :id="`${id}-error`" ref="errorSummary" class="sv-error" role="alert" tabindex="-1">{{ error }}</p>
      <div class="sv-actions"><button type="submit" class="sv-primary">{{ t.calculate }}</button><button type="button" @click="example">{{ t.example }}</button><button type="button" @click="reset">{{ t.reset }}</button></div>
    </form>
    <div v-if="result" class="sv-result" role="status" aria-live="polite" aria-atomic="true">
      <p><strong>{{ t.estimate }}</strong></p>
      <dl class="sv-totals"><div><dt>{{ t.total }}</dt><dd data-summary-cost>{{ money(result.total) }}</dd></div><div><dt>{{ t.monthly }}</dt><dd data-monthly-cost>{{ money(result.monthly) }}</dd></div></dl>
      <div class="sv-table-wrap" tabindex="0" role="region" :aria-label="t.breakdown"><table><caption>{{ t.breakdown }}</caption><thead><tr><th scope="col">{{ t.category }}</th><th scope="col">{{ t.tokens }}</th><th scope="col">USD/MTok</th><th scope="col">{{ t.subtotal }}</th></tr></thead><tbody><tr v-for="row in result.rows" :key="row.key"><th scope="row">{{ t.categories[row.key] }}</th><td>{{ integer(row.tokens) }}</td><td>{{ row.rate }}</td><td>{{ money(row.cost) }}</td></tr></tbody></table></div>
    </div>
    <p class="sv-note">{{ t.boundary }}</p>
  </section>
</template>
