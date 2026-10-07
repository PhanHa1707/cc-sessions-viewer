---
title: Claude Code Cost Calculator
description: Estimate Claude Code API-equivalent cost from input, output and cache tokens. Verify model rates and cache lifetimes, then compare monthly scenarios.
---

<script setup>
import CostCalculator from '../.vitepress/theme/components/CostCalculator.vue'
import PricingTable from '../.vitepress/theme/components/PricingTable.vue'
</script>

# Claude Code cost calculator

Enter recorded tokens to estimate their **API-equivalent cost in USD**. This free Claude token cost calculator separates normal input, output, cache reads and both cache-write lifetimes. No installation, account or API key required.

<noscript><p>Enable JavaScript to use the calculator. The formula and reviewed rates remain readable below.</p></noscript>

<CostCalculator locale="en" />

## Where to find Claude Code token usage {#find-usage}

The Session block in Claude Code’s `/usage` reports token usage and an estimated cost. Some versions also expose `/cost`; command availability and fields depend on your version. Enter **per-model token counts**, not the subscription percentage bars. For saved history, use the [local JSONL token counter](/tools/claude-code-token-counter).

Do not enter a combined “input including cache” number as base input. Anthropic’s `input_tokens` excludes `cache_read_input_tokens` and `cache_creation_input_tokens`. Split cache writes into 5-minute and 1-hour counts; if your source only gives a combined write count, its lifetime is unknown. Verify it rather than counting the combined total in both fields.

## Formula and worked example {#formula}

All five token categories are disjoint. Rates are USD per million tokens (MTok):

```text
cost = (base input × input rate
      + output × output rate
      + cache reads × cache-read rate
      + 5m cache writes × 5m-write rate
      + 1h cache writes × 1h-write rate) / 1,000,000
working-month cost = cost × summaries per day × working days
```

The public example uses Sonnet 5.5: 10,000 base-input tokens ($0.02), 5,000 output ($0.05), 300,000 cache reads ($0.06), 10,000 five-minute writes ($0.025) and no one-hour writes. **Total: $0.155**. Four identical summaries per day over 22 working days produce a hypothetical **$13.64 per month**. A daily aggregate should use one summary per day, not multiply its sessions again.

Intermediate calculations are not rounded; displayed costs use up to six decimal places. A positive result below $0.000001 is labeled as below that amount, not zero. This is a repeat-usage scenario, not a forecast of changing task sizes.

## Model rates and cache pricing {#rates}

**Rates checked on 2026-10-06** against [Anthropic’s official pricing](https://platform.claude.com/docs/en/about-claude/pricing). These are selected standard global API list prices, not every available model or a live price feed.

<PricingTable locale="en" />

Cache-read rates are model-specific: Opus 5.5 uses $0.20/MTok while Opus 4.8 uses $0.50/MTok. Do not apply a universal 0.1× rule. If a model is absent, choose **custom rates** and verify all five prices yourself; we never silently substitute an unrelated model.

Fast mode, batch discounts, geography/data-residency premiums, cloud-provider prices, negotiated discounts, taxes and tool charges are outside these presets. Multi-model work requires separate calculations per model and summing their costs; the same token count does not predict equal task quality across models.

## Is this my Claude Pro or Max bill? {#subscription}

No. API-equivalent token cost is not your subscription fee, remaining quota, reset time or number of prompts left. Use the actual provider’s usage report and invoice for financial reconciliation. Claude Code’s own estimate may use an organization’s configured rates, so matching list-price arithmetic need not match it.

See the [official Claude Code cost guide](https://code.claude.com/docs/en/costs) and the [subscription/quota distinction](/features/stats#subscription-quota).

## Compare historical projects, not just one estimate {#desktop}

The web calculator evaluates one entered summary. [Sessions Viewer statistics](/features/stats) compare recorded usage by project, model and time; [the Claude Code history guide](/guide/claude-code-session-viewer) shows reading, search and resume.

[Download Sessions Viewer](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest) for desktop history and analytics, or [count a saved JSONL locally in your browser](/tools/claude-code-token-counter). See [privacy and data handling](/guide/privacy). No token input is uploaded, saved in the URL or sent to a model.
