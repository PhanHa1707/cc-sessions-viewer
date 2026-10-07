<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIES, MODELS } from '../lib/usage-tools.mjs'
import { utilityCopy, type UtilityLocale } from '../lib/utility-copy'
const props = withDefaults(defineProps<{ locale?: UtilityLocale }>(), { locale: 'en' })
const t = computed(() => utilityCopy[props.locale])
</script>
<template>
  <div class="sv-table-wrap" tabindex="0" role="region" :aria-label="t.rates">
    <table><caption>{{ t.rates }}</caption><thead><tr><th scope="col">{{ t.model }}</th><th v-for="key in CATEGORIES" :key="key" scope="col">{{ t.categories[key] }}</th></tr></thead><tbody><tr v-for="model in MODELS" :key="model.id"><th scope="row">{{ model.name }}</th><td v-for="key in CATEGORIES" :key="key">{{ model.rates[key] }}</td></tr></tbody></table>
  </div>
</template>
