---
title: Where Kimi Code stores session history
description: Kimi Code stores one directory per session under ~/.kimi-code/sessions/, with agents/main/wire.jsonl as the transcript. Layout and jq commands.
---

# Where Kimi Code stores session history

Kimi Code's main transcript is `agents/main/wire.jsonl` inside a session directory under `~/.kimi-code/sessions/` by default. `KIMI_CODE_HOME` overrides the data root:

```
$KIMI_CODE_HOME/sessions/wd_<name>_<hash>/session_<uuid>/
```

`KIMI_CODE_HOME` defaults to `~/.kimi-code`. There is also a flat index at the root of that directory:

```
~/.kimi-code/session_index.jsonl
```

## The wd_ group directory

The `wd_` prefix stands for working directory. The name that follows is the project folder's own name plus a short hash of its full path:

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

The hash keeps two projects named `blog` in different parents from landing in the same bucket, so the directory listing is enough to tell projects apart.

## What is in a Kimi Code session directory

```
state.json                 ← session metadata
agents/main/wire.jsonl     ← the transcript
logs/
media/
```

`wire.jsonl` under `agents/main/` is the primary transcript. The `agents/` level exists because a session can run more than one agent, and `main` is the one you talked to.

## Reading a Kimi Code session from the terminal

List indexed session IDs and titles (the index is not the transcript):

```bash
jq -r '[.sessionId, .title] | @tsv' ~/.kimi-code/session_index.jsonl
```

Extract user prompts and assistant text from the primary event format:

```bash
jq -r 'if .type=="turn.prompt" then
    select((.origin.kind // "user")=="user") | .input
    | if type=="string" then . else .[]? | select(.type=="text") | .text end
  elif .type=="context.append_loop_event" and .event.type=="content.part" then
    .event.part | select(.type=="text") | .text
  else empty end' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

Inspect one session's metadata:

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## How do I resume this session?

Run `kimi --session SESSION_ID` from the project's directory with Kimi Code installed. The app offers [terminal resume](/features/resume), not in-app Kimi chat.

## Source and limitations

Implementation: [Kimi Code adapter](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/kimi.rs). Upstream: [Kimi Code repository](https://github.com/MoonshotAI/kimi-cli).

<!--@include: ../.vitepress/snippets/reference-en.md-->

Older `context.append_message` logs use a different envelope; the adapter has a fallback, while the example above targets primary events. It does not concatenate tool output. See [missing-session troubleshooting](/guide/troubleshooting).

## Or open it in an app

[Sessions Viewer](/guide/) reads `wire.jsonl` into the same conversation view as every other agent, keeps the `media/` attachments inline, and treats the session directory as the unit for renaming and deleting. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
