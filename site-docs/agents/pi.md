---
title: Where Pi stores session history
description: Pi stores JSONL sessions under ~/.pi/agent/sessions/ by default. Find the configured root, extract nested message text and resume by file path.
---

# Where Pi stores session history

Pi's default session root is `~/.pi/agent/sessions/`. Each session is a JSONL file with a `session` header and message/tree entries:

```
<session root>/--<encoded-project-path>--/<timestamp>_<uuid>.jsonl
```

A real path looks like this:

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

The filename starts with an ISO 8601 timestamp, so a plain `ls` sorts sessions chronologically.

## Finding the session root

Pi's root is configurable in three places, in this order of precedence:

1. The `PI_CODING_AGENT_SESSION_DIR` environment variable, if set and non-empty
2. `sessionDir` in `<agent dir>/settings.json`
3. The default, `<agent dir>/sessions`

The agent directory itself is `PI_CODING_AGENT_DIR`, defaulting to `~/.pi/agent`. So with nothing configured, sessions live at `~/.pi/agent/sessions`.

A one-shot `--session-dir` can write outside the root scanned by Sessions Viewer. Those files may exist but not appear in the app. Align the configured root; do not assume an unlisted file has been deleted.

## The project directory name

The absolute project path with `/` replaced by `-`, wrapped in a leading and trailing `--`:

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

The directory name is a useful hint, not a reversible encoding. The `cwd` in the file's first `session` record is the adapter's source for the project.

## What else lives in the agent directory

```
~/.pi/agent/
├── sessions/
├── extensions/          ← lifecycle extensions
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← credentials, do not read this
```

To read conversation history, inspect the session files rather than credential files. Sessions Viewer also reads `settings.json` to resolve a custom session root; tool management is a separate feature.

## Reading a Pi session from the terminal

Extract stored user/assistant text (all stored branches, not only the active one):

```bash
jq -r 'select(.type=="message") | .message
  | select(.role=="user" or .role=="assistant") | .content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

Most recent session for a project:

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

Count sessions per project:

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## How do I resume this session?

Run `pi --session "/absolute/path/to/session.jsonl"` from the project's directory with Pi installed. Pi resume uses the **file path**, not just the UUID. The app offers [terminal resume](/features/resume), not in-app Pi chat.

## Source and limitations

Implementation: [Pi adapter](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/pi.rs). Upstream: [Pi documentation](https://pi.dev/).

<!--@include: ../.vitepress/snippets/reference-en.md-->

Pi stores branches through entry IDs and parent IDs. The one-liner above reads stored text in file order; it is not an active-branch renderer. See [missing-session troubleshooting](/guide/troubleshooting).

## Or open it in an app

[Sessions Viewer](/guide/) resolves the session root the same way Pi does, checking the environment variable, then `settings.json`, then the default, and reads only the session records, never the auth or credential files beside them. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
