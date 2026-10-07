# Keyword-led acquisition research

Research date: 2026-10-06. Site: https://sessions-viewer.js-bridge.com. This is a prioritized opportunity assessment, not a paid keyword-volume export or a Google rank report.

## What changed

The site has 81 documentation routes and substantial technical SEO checks. Its strongest product fit is local history, recorded token usage and estimated cost; the public site currently explains those features but offers no immediate calculation/counting utility. Prioritize useful tools and search intent over more near-duplicate agent introductions.

## Evidence and limits

1. Six public Google English autocomplete requests (`client=firefox&hl=en`) for `claude code cost`, `claude code token`, `claude code usage`, `claude code history`, `codex usage`, `codex token`. No country parameter, signed-in Google SERP or exhaustive keyword list. Suggestions indicate recognized queries, **not monthly volume or relative popularity**. Raw responses: `/tmp/sv-keyword-research/*.json`.
2. OpenAI-backed web search across calculator/cache pricing, token counters/ccusage, Codex usage/history, Claude history/resume. Stored response `muwn4gqpxqk9u7`. These are source-linked retrieval samples, **not a stable Google top-10 ranking**.
3. Public npm downloads API: https://api.npmjs.org/downloads/point/last-week/ccusage returned **197,130 downloads**, 2026-09-28 through 2026-10-04. This supports interest in the tracking category, not 197,130 users or searches; automation/repeat installs are included. GitHub API returned 403, so no star count is claimed.
4. Directly fetched and read competitor pages: [Loop Engineering](https://loopengineering.app/claude-code-cost-calculator/) and [UsageMeter](https://usagemeter.app/en/tools/claude-code-cost). Both offer browser calculators with separate cache categories and subscription caveats. They are competing solutions, not evidence that this site's future page will outrank them.
5. Read current first-party [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing) and [Claude Code cost guide](https://code.claude.com/docs/en/costs). Markdown snapshots `/tmp/sv-keyword-research/{pricing,costs}.md`. Normal API pricing is not Pro/Max subscription billing, remaining quota or a provider invoice. Cache-read multipliers differ by model; don't assume every model uses 0.1×.
6. Earlier Search Console snapshot: only 3 indexed/51 not indexed, seven indexing requests accepted, sitemap 81 URLs. This is historical and **not current query/impression data**. No new account operation or indexing request is part of this work.

No independently verified monthly volume, market-specific KD, traffic forecast or Google Trends comparison is available. User-provided example KD values are intentionally not reused as measured research. Exact `cost calculator`/`token counter` are supported by competing tools/retrieval; they were not returned verbatim in the six short-prefix autocomplete samples.

## Prioritized keyword map

Priority reflects product fit, demonstrated query patterns, useful deliverability and competitive intent—not a fabricated demand score. Related phrases share a substantive page rather than each receiving a thin page.

| Priority / cluster | Terms | Evidence / intent | Destination / action |
| --- | --- | --- | --- |
| P1 cost utility | claude code cost calculator; claude token cost calculator; claude code cost per token; claude code cost per million tokens; claude code cost per month; claude code token price | Competing calculators + cost/token autocomplete; calculate API-equivalent spend | New `/tools/claude-code-cost-calculator`, interactive manual tokens/rates, cache split, monthly assumptions, formula and worked example |
| P1 recorded usage utility | claude code token counter; claude code token usage; claude code token usage report | Counter/tracker retrieval + token autocomplete; measure existing work | New `/tools/claude-code-token-counter`, local JSONL usage aggregation, streaming dedup, diagnostics; explicitly not pasted-text tokenization |
| P2 usage analytics | claude code usage tracker; claude code usage monitor; claude code usage dashboard; codex token usage; codex token usage by model; codex usage tracker | Usage/token autocomplete + npm category activity; compare projects/models/time | Strengthen existing `/features/stats`; links to utilities and desktop analytics, no new overlapping tracker page |
| P2 history | claude code history viewer; claude code history search; claude code history session | History autocomplete and competing history tools; find/read/resume sessions | Strengthen existing `/guide/claude-code-session-viewer` title/summary and useful stats/tool links; keep existing URL |
| P2 troubleshooting | claude code history disappeared; claude code history gone | History autocomplete; recover discoverable local records | Existing `/guide/troubleshooting` and agent storage docs, no promise of recovering deleted files |
| P3 Codex history | codex session history; codex session viewer; codex resume session | Product fit and retrieved alternatives, weaker current demand evidence | Existing `/guide/codex-session-viewer` and `/agents/codex`; retain canonical coverage rather than duplicate landing pages |
| Defer plan/quotas | claude code usage limits; claude code usage reset; codex usage limits; codex usage reset; claude code cost vs codex | Strong autocomplete presence but account-dependent, volatile plan rules | Existing honest quota explanation; do not infer reset windows, token allowance or unlimited capacity from local log totals |
| Defer pasted-text counter | claude token counter; count tokens in prompt | Different tokenizer/estimation intent, not equivalent to recorded usage | Clearly state utility does not tokenize prompt text; don't target exact Claude tokenization with a characters÷4 estimate |

## Content/product differentiation

- No installation, account or API key needed to try the two public tools. Widget input stays in browser memory, not localStorage, URL queries, analytics or uploaded requests. Normal documentation asset requests still occur.
- Calculator exposes source, checked date, exact per-category rates, custom-rate state and monthly assumptions. No unknown-model rate fallback. Input excludes cache reads/writes; 5m and 1h writes are disjoint.
- Counter reads only user-selected/pasted Claude assistant JSONL usage; no folder discovery. Match `message.id` streaming snapshots by highest recorded total. Show missing IDs, skipped/malformed usage and unsupported formats. No invoice, real-time quota or full Rust-parser parity claim.
- Downloads/analytics are a natural next step for multi-file/project/model comparisons, not a forced gate before getting a result.
- Keep English, Chinese and Japanese destinations and navigation aligned. Avoid changing existing canonical URLs or diluting the desktop homepage into an unrelated utility directory.

## Post-deployment measurement

1. Confirm six new locale routes deploy with 200 HTML, canonical/hreflang and sitemap membership. Local checks do not prove deployment.
2. In Search Console, filter by each exact destination and query families (cost/calculator; token/usage; history). Compare impressions, clicks, CTR and average position over comparable 28-day periods after discovery. Treat very small samples cautiously.
3. Check indexed/canonical state before rewriting pages for low impressions; current queue/quota is not resolved by adding keywords.
4. Review what visitors can actually finish: calculate, understand caveats, then reach stats/download. No tracker installed in this change; analytics setup/account changes need separate consent.
5. Refresh rates only after actual verification, keep source/date/tests in sync. Do not change dates every build.
6. None of this guarantees indexing, ranking, traffic or AI citation; no deployment/index notification is performed automatically.

## Implementation and verification result

Local implementation completed 2026-10-06:

- Two functional browser tools at `/tools/claude-code-cost-calculator` and `/tools/claude-code-token-counter`, mirrored under `/zh/` and `/ja/` (six new pages). The calculator has seven reviewed explicit pricing presets/custom prices, separate cache TTLs and monthly assumptions. The counter handles user-selected JSONL, highest-total streaming snapshots, coverage diagnostics and bounded inputs; it does not tokenize prompt text or promise desktop-parser parity.
- Existing stats and Claude history pages now match usage-tracker/history intent; home, sidebars and tool overview link to useful tools. No separate near-duplicate monitor/usage/history pages. No existing canonical URL changed.
- Added no-JavaScript explanations and SSR pricing table. Widgets load only from their relevant pages. No new package, tracking/storage primitive, CLI/provider execution or private transcript access.
- **124 documentation tests, 12 Vue interaction tests and documentation/component/test typecheck pass.** Preview-origin and explicitly restored production-default builds pass: **87 content pages and 88 HTML anchor pages**. New SSR guards verify all six forms/labels and the exact pricing table/source/date, with negative regressions for missing controls/rates and false zero totals.
- `git diff --check`, staged diff check, JS syntax and JSON configs pass. Cargo.lock SHA remains `aba1c46396e3afb2000c306b3c23ff41b36afa57090788671ae0c5ec7b7659fe`; package lock untouched. External staging during the task deleted four old docs and added indexing-pending.md; it was not reverted or changed. The subsequent staged snapshot SHA `6a0d65a78738e5dda5a83bc44c3e66c74996ce47379c5b2b08d9e0217cc44c7d` remains intact.
- Existing Chrome process was present but no controllable window was available (both app and pid lookup). **No live browser/mobile/light-dark visual acceptance was performed**, and no headless/independent browser was launched. Vue tests/static DOM checks are not visual acceptance. No preview server was left running.
- No full desktop/Rust suite, deployment, account operation, indexing notification, current ranking/traffic or AI-citation verification performed. Tool availability on the public domain still depends on the user's future deployment.

Reproduce: `npm run docs:test`, `npm run docs:test:ui`, `npm run docs:typecheck`, `npm run docs:build`. Logs: `/tmp/sv-keywords-{tests,ui-tests,types,override,build}.log`. Implementation plan: `docs/plans/2026-10-06-keyword-led-tools.md` (local ignored plan).
