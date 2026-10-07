---
title: Claude Code Token Counter
description: Count recorded Claude Code JSONL token usage locally in your browser. Merge duplicate message IDs and flag missing usage; no transcript uploads.
---

<script setup>
import TokenCounter from '../.vitepress/theme/components/TokenCounter.vue'
</script>

# Claude Code token counter

Count **recorded token usage** from a Claude Code JSONL file, locally in your browser. Select a file or paste JSONL; try the public synthetic example before using your own data. This is not a tokenizer for prompt text.

<noscript><p>Enable JavaScript to count a local file. The supported format and limitations remain readable below.</p></noscript>

<TokenCounter locale="en" />

## Which file and fields does this count? {#format}

Claude Code normally stores project transcripts under `~/.claude/projects/`. Pick a session’s `.jsonl` file; this tool cannot scan your folders or read credentials. See [Claude Code file locations](/agents/claude-code) if you cannot find it.

Supported rows have `type: "assistant"` and numeric, nonnegative whole `message.usage.input_tokens` and `output_tokens`. Optional `cache_read_input_tokens` and `cache_creation_input_tokens` are included. Text-only messages, user prompts, raw `/usage` output, ccusage exports and Codex files are not this tool’s input format.

```json
{"type":"assistant","message":{"id":"public-example","usage":{"input_tokens":100,"output_tokens":40,"cache_read_input_tokens":1000,"cache_creation_input_tokens":300}}}
```

This record contains **1,440 recorded tokens**: 100 + 40 + 1,000 + 300. This is cumulative API usage, not unique words or a context-window size.

## Streaming duplicates and cache writes {#dedup}

Claude can save several assistant rows with the same `message.id` during one streamed response. The counter keeps the whole usage snapshot with the highest total; a tie uses the last snapshot. It does **not** add each snapshot or synthesize per-field maxima.

Rows without an ID are counted separately and flagged because they cannot be reliably deduplicated. Copied files, reused IDs and incomplete snapshots can affect coverage. This browser tool is not a guarantee of parity with the desktop’s full adapter, turn boundaries or historical cache heuristics.

When a record has both the legacy cache-creation total and `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`, use the larger of the legacy total and split sum—never add both. Inconsistent totals are flagged. An unsplit total does not establish a cache lifetime or dollar cost.

## What skipped or missing rows mean {#coverage}

- Invalid JSON and invalid token fields are skipped and counted in diagnostics.
- Assistant rows without a usage object are reported as missing usage, not measured zero-cost work.
- Absent optional cache fields contribute zero to this sum; that is not evidence that actual cache use was zero.
- If no usable usage records exist, an error appears rather than presenting zero as a measured total.
- Totals combine all models in the selected input. Use desktop statistics for per-model counts rather than pricing a mixed-model total as one model.
- Limits are **5 MiB and 20,000 lines** per input. Use a smaller excerpt or the desktop app for larger/multiple files; no files are automatically discovered or merged.

The public example has two distinct assistant messages, one coalesced duplicate and **1,710 tokens**. Parsing is independently tested with synthetic inputs; no actual CLI-version end-to-end acceptance or private transcript is part of those tests. Reviewed 2026-10-06.

## Can I count tokens in a pasted prompt? {#prompt-text}

Not with this tool. Exact model input tokenization is different from recorded billing usage. Character or word counts, tool definitions, images and hidden context cannot be turned into an exact Claude usage total by this JSONL counter.

It also does not read live Pro/Max limits, infer a reset time or reconstruct missing records. For account limits use the provider’s own tools; see [usage versus quota](/features/stats#subscription-quota).

## Convert usage to cost or track history {#next}

Use the [Claude Code cost calculator](/tools/claude-code-cost-calculator) with per-model counts and verified cache lifetimes. Tokens from different models should not all be priced as one model.

For project/model/time breakdowns, [Sessions Viewer statistics](/features/stats) provide desktop history analysis; [the Claude Code history workflow](/guide/claude-code-session-viewer) covers reading, search, export and resume. [Download the free app](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest).

Input remains in browser memory, without uploading, URL-query persistence or localStorage. Reset or reload clears it. The site still loads normal documentation assets. Read [privacy and data handling](/guide/privacy) before sharing or exporting your own history.
