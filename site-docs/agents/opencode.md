---
title: Where opencode stores session history
description: opencode keeps every session in one SQLite database at ~/.local/share/opencode/opencode.db. The schema, the four tables that matter, and SQL to read it.
---

# Where opencode stores session history

The opencode layout supported here stores sessions in a SQLite database at `~/.local/share/opencode/opencode.db`, or `$XDG_DATA_HOME/opencode/opencode.db` when configured:

```
~/.local/share/opencode/opencode.db
```

It follows the XDG base directory spec, so `$XDG_DATA_HOME/opencode/opencode.db` wins if that variable is set. That applies on macOS too, where most apps would use `~/Library/Application Support`.

There are no per-session files. A `grep -r` across your home directory will not find an opencode conversation, which is usually how people discover this.

## The four tables that matter

```sql
project  -- id (sha1), worktree (the project directory), vcs, time_*
session  -- id ("ses_…"), project_id, parent_id, slug, title, directory,
         -- model (JSON), tokens_* (5 columns), cost, time_created,
         -- time_updated, time_archived
message  -- id ("msg_…"), session_id, time_created, data (JSON envelope)
part     -- id ("prt_…"), message_id, session_id, time_created, data (JSON body)
```

The database has more tables (`workspace`, `todo`, `permission`, `event`, `credential` and migration bookkeeping), but a transcript is `session` → `message` → `part`.

`message.data` is a JSON envelope: `role`, `modelID`, `providerID`, `tokens{input,output,reasoning,cache{read,write}}`, `cost`, `time{created,completed}`. `part.data` is the body, with a `type` of `text`, `reasoning`, `tool`, `file`, `step-start`, `step-finish` and others.

## Sub-agent sessions

A session with a non-null `parent_id` is a sub-agent run spawned by another session. These are real API calls that cost real money, but they are not conversations you started. Anything listing "your sessions" should filter them out, and anything totalling spend must include them.

## Open it read-only

opencode's TUI may be writing to this database while you read it. SQLite's WAL mode makes concurrent reads safe, but only if you open read-only and do not hold a write lock:

```bash
sqlite3 "file:$HOME/.local/share/opencode/opencode.db?mode=ro" ".tables"
```

## Reading an opencode transcript with SQL

List sessions with their project and cost, newest first:

```sql
SELECT s.id, p.worktree, s.title, s.cost,
       datetime(s.time_created/1000, 'unixepoch') AS created
FROM session s
JOIN project p ON p.id = s.project_id
WHERE s.parent_id IS NULL
ORDER BY s.time_created DESC
LIMIT 20;
```

Print one session's text, in order:

```sql
SELECT json_extract(m.data, '$.role') AS role,
       json_extract(pt.data, '$.text') AS text
FROM message m
JOIN part pt ON pt.message_id = m.id
WHERE m.session_id = 'ses_...'
  AND json_extract(pt.data, '$.type') = 'text'
ORDER BY m.time_created, pt.time_created;
```

Total spend per project:

```sql
SELECT p.worktree, ROUND(SUM(s.cost), 2) AS usd, COUNT(*) AS sessions
FROM session s JOIN project p ON p.id = s.project_id
GROUP BY p.worktree ORDER BY usd DESC;
```

That last query includes sub-agent sessions on purpose, because they are part of the bill.

## Why cost has to come from the database {#cost-from-db}

opencode can point at any provider: DeepSeek, OpenRouter, a local model, anything. A price table keyed on model name cannot reconstruct what a call actually cost, so the real `modelID` and `cost` recorded per assistant message are the only trustworthy source.

## How do I resume this session?

Run `opencode --session SESSION_ID` from the project's directory with opencode installed. The app offers [terminal resume](/features/resume), not in-app opencode chat.

## Source and limitations

Implementation: [opencode adapter](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/opencode.rs). Upstream: [opencode documentation](https://opencode.ai/docs/).

<!--@include: ../.vitepress/snippets/reference-en.md-->

SQL examples target the database schema described above; they do not cover older file-based layouts. Read-only queries are distinct from explicit rename/trash/restore actions that write to the database. See [missing-session troubleshooting](/guide/troubleshooting).

## Or open it in an app

[Sessions Viewer](/guide/) queries this database read-only, hides sub-agent sessions from the list while still counting them in the stats, and shows opencode conversations next to your JSONL-based agents in the same view. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi) and [Antigravity CLI](/agents/antigravity-cli).
