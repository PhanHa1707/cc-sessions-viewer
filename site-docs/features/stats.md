---
title: Track coding-agent token usage and estimated cost
description: Understand recorded Claude Code and Codex usage, model-price estimates, opencode recorded costs, missing usage fields and subscription quotas in Sessions Viewer.
image: /screenshots/stats.png
---

# Token usage and estimated cost

Sessions Viewer aggregates **recorded usage**, not your provider's invoice. Open statistics with `⌘⇧S` to compare projects, models, tools and time periods. Missing usage is not proof of a free call: the supported Antigravity CLI format contains no token fields.

![Token and cost analytics broken down by project and model](/screenshots/stats.png)

## What can I compare? {#usage-breakdown}

- Project and model: where recorded token use and estimated spend accumulate.
- Tool: which tools were called and how often.
- Time: today, the last 7 days and the last 30 days.
- Agent: all sources or one selected agent.

Coverage depends on what a transcript records and what its adapter understands. Use the [compatibility and evidence matrix](/guide/compatibility) before comparing totals from different agents.

## Where do the prices come from? {#price-source}

The app fetches a models.dev-format catalog from the [js-bridge mirror](https://www.js-bridge.com/api/models), falling back to [models.dev](https://models.dev/api.json). Prices are cached locally for 24 hours. This is a network request for a catalog, not a request that needs your transcript text.

![The model-price table in the app](/screenshots/model-price.png)

Inspect the price table to see available rates. Unknown model IDs may use a fallback estimate in applicable paths; absent cache rates and unrecognized provider pricing need care. A missing field or price is not evidence of zero usage or zero actual cost.

## Is the displayed cost my bill? {#cost-vs-bill}

No. Catalog-based estimates do not necessarily include your provider's negotiated rates, routing markup, discounts, subscription fees, tools or other charges. Cache and model matching also affect the result. Reconcile financial decisions with the provider's actual usage report and invoice.

opencode is different: the viewer uses costs recorded in its own database, including sub-agent work. Recorded cost is still not an independently verified invoice. See [opencode cost provenance](/agents/opencode#cost-from-db).

Antigravity CLI contributes no token usage in the supported format. Other agents require usage fields in the saved records; text-only examples cannot demonstrate cost accounting.

## How are subscription quotas different? {#subscription-quota}

Claude and Codex subscription accounts can show quota windows beside the composer. Availability depends on account/authentication and the provider's returned windows; API-key accounts do not have the same subscription quota badge.

Quota remaining is not the same as token-price spend. Quota refresh may contact authenticated provider/CLI services. See [privacy and network behavior](/guide/privacy).

## macOS menu bar

The menu bar shows today, 7-day and 30-day totals per agent. These have the same usage coverage and cost limitations as the statistics view.

## Evidence

Reviewed on 2026-10-05 against Sessions Viewer 0.6.0: [pricing implementation](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/stats/pricing.rs) and [statistics adapters](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/stats). This documents implementation, not a billing audit.
