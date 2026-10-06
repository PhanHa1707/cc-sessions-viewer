---
title: Where Claude Code stores session history
description: Claude Code writes one JSONL transcript per session under ~/.claude/projects/. The layout, record format, structured diffs and jq commands to read one.
---

# Where Claude Code stores session history

Claude Code keeps every session as a single JSONL file under your home directory:

```
~/.claude/projects/<project-dir>/<session-id>.jsonl
```

`<session-id>` is the UUID you pass to `claude --resume`. Some CLI versions also maintain `sessions-index.json`; Sessions Viewer can scan the JSONL files without that index.

## The project directory name

Claude Code derives the directory name from the absolute path of the project by replacing every `/` with `-`, including the leading one:

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

Windows separators and the drive colon are also replaced (`E:\work\blog` → `E--work-blog`). This encoding is not reversible when names contain dashes. Prefer the record's `cwd` to identify the project rather than guessing from the folder name.

## What a Claude Code record looks like

One JSON object per line, keyed by `type`:

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

The conversation lives in `message.content`, an array of blocks:

| Block `type` | Contents |
| --- | --- |
| `text` | Plain message text |
| `thinking` | Extended thinking, when the model produced any |
| `tool_use` | A tool call: `name` plus an `input` object |
| `tool_result` | The result, matched to a call by `tool_use_id` |
| `image` | `source.base64` for pasted images, `source.url` for referenced ones |

There are other `type` values at the record level too, such as `custom-title` when a session has been renamed.

### Structured diffs {#structured-diffs}

When a `tool_result` comes back from a file edit, it often carries a `structuredPatch` field: the diff in hunk form rather than as a blob of text. That field is what makes it possible to render an edit as a real diff.

## Reading a Claude Code session from the terminal

Extract user and assistant text (not tools or images):

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.claude/projects/-Users-me-apps-blog/<session-id>.jsonl
```

List which tools a session called, most used first:

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

Find the sessions that touched a particular file:

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## How do I resume this session?

Run `claude --resume SESSION_ID` from the project's directory with Claude Code installed. Or use the app's [terminal or in-app chat](/features/resume). Continuing may contact the configured provider and append new turns.

## Source and limitations

Implementation: [Claude Code adapter](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/claude.rs). Upstream: [Claude Code documentation](https://code.claude.com/docs/en/overview).

<!--@include: ../.vitepress/snippets/reference-en.md-->

Missing a session? Follow the [discovery checklist](/guide/troubleshooting).

## Or open it in an app

Follow the [Claude Code search, export and resume workflow](/guide/claude-code-session-viewer) for step-by-step use and manual-vs-GUI tradeoffs.

[Sessions Viewer](/guide/) reads these files directly. Thinking blocks, tool call and result pairing, `structuredPatch` diffs and inline images all render the way they happened, history browsing does not rewrite the originals, and `⌘⇧F` searches across every project at once. It also reads [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
