---
title: Where Antigravity CLI stores session history
description: Antigravity CLI (agy) stores conversations under ~/.gemini/antigravity-cli/brain/<uuid>/ as step records. Layout, format quirks and jq commands.
---

# Where Antigravity CLI stores session history

Antigravity CLI (`agy`) stores transcript steps under `~/.gemini/antigravity-cli/brain/<conversation-uuid>/.system_generated/logs/`. Compare `transcript.jsonl` with `transcript_full.jsonl`; neither is guaranteed complete:

```
~/.gemini/antigravity-cli/brain/<conversation-uuid>/.system_generated/logs/transcript.jsonl
```

The full layout:

```
~/.gemini/antigravity-cli/
├── brain/<conversation-uuid>/
│   ├── .system_generated/logs/
│   │   ├── transcript.jsonl        ← rolling window
│   │   └── transcript_full.jsonl   ← nominally complete
│   ├── chunks/
│   ├── scratch/
│   └── media__<timestamp>.<ext>    ← your attachments
└── history.jsonl                   ← the index
```

## Which project a conversation belongs to

Nothing in the path says. The index at the root does:

```bash
jq -r '[.timestamp, .workspace, .display] | @tsv' \
  ~/.gemini/antigravity-cli/history.jsonl | sort -r | head
```

Each line is `{display, timestamp, workspace, conversationId}`. `workspace` is the project directory and `conversationId` is the folder name under `brain/`.

## Which transcript file to read

Neither is reliably complete. `transcript.jsonl` is a rolling window compacted at checkpoints, and `transcript_full.jsonl`, despite its name, gets truncated at checkpoints too. The practical rule is to read whichever is larger.

`transcript.jsonl` is also not append-only. The CLI rewrites the whole file when it compacts, so anything watching it has to handle the file shrinking as well as growing. A tail that assumes monotonic growth will silently stop updating.

## The step record format

```json
{"step_index":12,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"...",
 "created_at":"...","content":"...","thinking":"...","tool_calls":[{"name":"...","args":{}}]}
```

`source` is one of `USER_EXPLICIT`, `MODEL` or `SYSTEM`.

Three things about `content` will bite you if you treat it as plain text:

- User input is wrapped in XML. The real message sits inside `<USER_REQUEST>…</USER_REQUEST>`, followed by a metadata block.
- Tool results carry a two-line prefix. Every one starts with `Created At: …\nCompleted At: …\n` before the actual output.
- Code edits embed a diff. `CODE_ACTION` steps contain a `[diff_block_start]` marker followed by a unified diff.

There are no token, usage or model fields anywhere in these records, so cost and token accounting are not available for this agent.

## Reading an Antigravity CLI conversation from the terminal

Print the steps with their source and type:

```bash
jq -r '[.step_index, .source, .type] | @tsv' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl
```

Pull out just what you typed, with the XML shell removed:

```bash
jq -r 'select(.type=="USER_INPUT") | .content | strings
  | select(contains("<USER_REQUEST>") and contains("</USER_REQUEST>"))
  | split("<USER_REQUEST>")[1] | split("</USER_REQUEST>")[0]' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl
```

## How do I resume this conversation?

Run `agy --conversation CONVERSATION_ID` from the workspace with the matching CLI installed. The app offers [terminal resume](/features/resume), not in-app Antigravity chat.

## Source and limitations

Implementation: [Antigravity CLI adapter](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/agy.rs).

<!--@include: ../.vitepress/snippets/reference-en.md-->

This page describes the `agy` files read by the adapter, not every product named Antigravity. A larger file may preserve more content, but cannot recover content already absent from both files. See [missing-session troubleshooting](/guide/troubleshooting).

## Or open it in an app

[Sessions Viewer](/guide/) picks the larger of the two transcripts, strips the XML wrapper and the timestamp prefixes, renders `CODE_ACTION` diffs as real diffs, and handles the file being rewritten underneath it. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi) and [opencode](/agents/opencode).
