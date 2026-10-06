---
title: Why are my coding-agent sessions missing from Sessions Viewer?
description: Check agent data roots, desktop environment variables, Codex archives, project paths and supported record formats without moving or deleting private transcripts.
---

# Why can't Sessions Viewer find my session?

Usually the first checks are the **data root, project identity and record format**. A CLI can write somewhere the viewer does not scan; an archived session or a different project path can also hide the record you expect. An empty list does not prove the transcript has been deleted.

## 1. Does a transcript exist at the expected location?

Use the [locations and formats table](/agents/) and the reference page for your agent. Run that page's read-only command against one known file; do not search credential files or copy private data into a public issue.

- No file yet: confirm the CLI saved a session and that you are looking at the same OS user/home directory.
- A file exists elsewhere: compare the actual root with the viewer's supported overrides before moving anything.
- An opencode DB exists: query it read-only with `mode=ro`, not by looking for JSONL.

## 2. Does the desktop app see the same configuration?

For Grok, Kimi, Pi and opencode, compare `GROK_HOME`, `KIMI_CODE_HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR` and `XDG_DATA_HOME` with the [supported-root table](/agents/). Pi also reads `settings.json.sessionDir`.

An environment variable exported in a terminal is not necessarily inherited by an app launched from Finder or a shortcut. After aligning the launch environment, restart the app and recheck discovery. This is not a recommendation to modify your global environment blindly.

The current Claude Code, Codex and Antigravity readers use fixed home-directory locations. A custom CLI root is not automatically scanned. Keep originals backed up; changing the viewer's discovery behavior is safer than blindly relocating live data.

## 3. Is it archived, renamed or under another project?

- **Codex archives:** check `~/.codex/archived_sessions/` and enable the app's archived-session display. Archived records may require unarchiving in Codex before continuing.
- **Project directory changed:** a different path, linked worktree, symlink or old checkout can group the session under another project. Use the [project metadata table](/agents/) rather than guessing from folder names.
- **Unknown title:** search for a distinctive prompt with global search instead of relying only on the session name.
- **Trash:** if you explicitly deleted it in the app, inspect the [shared trash](/features/export-and-trash) before creating a replacement.

## 4. Is the record shape supported and readable?

Use read-only checks on a backup or an inactive file:

- JSONL must have readable JSON records; a live writer can temporarily leave a partial last line.
- Codex discovery expects a first `session_meta` record; Pi expects a first `session` header with ID, timestamp and `cwd`.
- Grok's visible stream is `updates.jsonl`, not `chat_history.jsonl`; Kimi's main wire file is `agents/main/wire.jsonl`.
- Antigravity can compact both transcript files. Check the larger one, but already missing content cannot be recreated from the files.
- opencode's older file layout or a changed SQLite schema may need a new adapter version.

Check that your user can read the file and parent directories. Do not bypass file permissions or edit the transcript to make a parser accept it.

## 5. What should I include in a bug report?

Provide the app version, CLI version, OS, expected layout, whether a custom root is set, and a minimal synthetic record showing the failing shape. Redact usernames and project paths. State whether the session is live or archived. Never include credentials or a full private database; see [privacy and data handling](/guide/privacy).

[Open an issue](https://github.com/jerrywu001/cc-sessions-viewer/issues) or [download the latest release](/guide/install). Discovery rules above were reviewed against [source revision 22fefc6](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents) on 2026-10-05, not tested against every CLI release.
