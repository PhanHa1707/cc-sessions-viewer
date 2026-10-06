---
title: Coding agent session history — locations, formats and resume commands
description: Compare where Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode store sessions, how to resume them, and what Sessions Viewer supports.
---

# Where coding agents store session history

Claude Code and Codex store JSONL under `~/.claude/projects/` and `~/.codex/sessions/`. Pi uses `~/.pi/agent/sessions/`; Grok Build, Kimi Code and Antigravity CLI use session directories. The supported opencode layout uses one SQLite database. The tables below compare the defaults, project metadata and resume commands.

## Default locations and formats

| Agent | Default location | Transcript |
| --- | --- | --- |
| [Claude Code](/agents/claude-code) | `~/.claude/projects/` | `<project>/<session-id>.jsonl` |
| [Codex](/agents/codex) | `~/.codex/sessions/` | `<YYYY>/<MM>/<DD>/rollout-*.jsonl`; archives in `~/.codex/archived_sessions/` |
| [Grok Build](/agents/grok-build) | `~/.grok/sessions/` | `<group>/<session-id>/updates.jsonl` |
| [Kimi Code](/agents/kimi-code) | `~/.kimi-code/sessions/` | `<group>/<session-id>/agents/main/wire.jsonl` |
| [Pi](/agents/pi) | `~/.pi/agent/sessions/` | `<project>/<timestamp>_<uuid>.jsonl` |
| [Antigravity CLI](/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | `<uuid>/.system_generated/logs/transcript*.jsonl` |
| [opencode](/agents/opencode) | `~/.local/share/opencode/opencode.db` | SQLite: `session` → `message` → `part` |

## How can I resume a session? {#resume-commands}

Run from the original project directory with the corresponding CLI installed and configured. Replace `SESSION_ID`, `CONVERSATION_ID` or the path; these commands start the CLI and can make provider requests or write data.

| Agent | Terminal command | In-app chat |
| --- | --- | --- |
| Claude Code | `claude --resume SESSION_ID` | Yes |
| Codex | `codex resume SESSION_ID` | Yes |
| Grok Build | `grok --resume SESSION_ID` | No |
| Kimi Code | `kimi --session SESSION_ID` | No |
| Pi | `pi --session "/absolute/path/to/session.jsonl"` | No |
| Antigravity CLI | `agy --conversation CONVERSATION_ID` | No |
| opencode | `opencode --session SESSION_ID` | No |

All seven have history browsing/search, export and terminal resume in Sessions Viewer. Statistics depend on recorded usage: Antigravity CLI's supported transcript has no usage fields. See [resuming sessions](/features/resume) and [exporting sessions](/features/export-and-trash).

## Where does the project identity come from?

| Agent | Metadata used by the viewer |
| --- | --- |
| Claude Code | JSONL `cwd`; encoded folder name is a fallback, not a reversible path |
| Codex | `session_meta.payload.cwd` |
| Grok Build | `summary.json` → `info.cwd`, with group-directory fallbacks |
| Kimi Code | Session metadata / index; `state.json.cwd` identifies the working directory |
| Pi | `cwd` in the first `session` record |
| Antigravity CLI | `history.jsonl` → `workspace` |
| opencode | `project` table joined by `session.project_id` |

## Which custom roots does the viewer discover?

| Agent | Recognized override |
| --- | --- |
| Grok Build | `GROK_HOME` (default `~/.grok`) |
| Kimi Code | `KIMI_CODE_HOME` (default `~/.kimi-code`) |
| Pi | `PI_CODING_AGENT_SESSION_DIR`, then `settings.json.sessionDir`, then `<PI_CODING_AGENT_DIR>/sessions` |
| opencode | `XDG_DATA_HOME` (default `~/.local/share`) |

The current Claude Code, Codex and Antigravity adapters read fixed locations under the home directory. This is a **viewer limitation**, not a claim that those CLIs cannot use other roots. Environment variables in your shell may not reach a desktop app launched from Finder or a shortcut. Follow the [missing-session checklist](/guide/troubleshooting) before moving files.

## Read a transcript without the app

Each agent's reference page includes `jq` or read-only `sqlite3` examples. They extract selected fields, not every image, tool result or branch. Use [Sessions Viewer](/guide/) for a searchable view, or [download the app](/guide/install).

## Evidence and scope

Path and resume information was checked against the [agent adapters at source revision 22fefc6](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents). Each reference page links its own adapter and, where identified, an upstream entry point.

<!--@include: ../.vitepress/snippets/reference-en.md-->
