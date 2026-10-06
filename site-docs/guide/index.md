---
title: What Sessions Viewer does
description: Sessions Viewer turns the local transcripts of Claude Code, Codex and five other coding agents into one searchable workspace you can read and resume.
---

# What Sessions Viewer does

Sessions Viewer reads the transcripts that coding agent CLIs leave on your disk and shows them as one workspace. Open a project, see exactly what happened in a session, then continue the work from the same place. You never have to hunt through JSONL files by hand.

> [!TIP]
> **Tool management** is the newest part of the app: skills, MCP servers, hooks and instruction files for all seven agents in one place. Find duplicate skills and broken links on your machine and repair them, inspect cached MCP context estimates and preview file edits. Review hook commands before testing them: a dry-run executes the script, it is not a sandbox. [Read the tool management guide](/tools/).

## Quick answers

- [Where are my agent's transcripts and how do I resume them?](/agents/)
- [Why is a session missing?](/guide/troubleshooting)
- [Which features are local, and which can use the network?](/guide/privacy)
- [How do I install the app?](/guide/install)
- [How do I find and continue Claude Code history?](/guide/claude-code-session-viewer)
- [How do I locate and resume Codex rollouts?](/guide/codex-session-viewer)
- [Which formats and CLI versions have evidence? Download samples.](/guide/compatibility)
- [How do I share skills or check MCP configuration?](/tools/share-skills)
- [Who maintains the project and its documentation?](/guide/about)

## Read and find context

The [reading view](/features/read-and-search) replays a session the way it happened. Thinking chains stay attached to their messages, each tool call sits next to its result, file edits render as structured diffs, and pasted screenshots appear inline.

Global search (`⌘⇧F`) runs across every project and jumps to the exact matching message. Inside a long session, the prompt list shows only what you typed, so you can pick a prompt and scroll straight to it, with the message flashed to mark the spot. Recently opened read and chat views stay in a per-project history with search and favourites.

## Continue the work

Claude Code and Codex sessions can be continued in the [built-in chat](/features/resume), with model, reasoning effort (including Opus Ultracode) and permission mode as live controls. Any session can be resumed with one click in the embedded terminal or in Terminal.app, cmux, iTerm2, Ghostty or Warp.

Shell tabs run ordinary commands beside agent sessions. Tab titles/directories can be restored after restart, but a new shell starts; previous running commands are not restored. Launch arguments such as `--dangerously-skip-permissions` are configured per agent and added to new and resumed sessions automatically.

## Keep projects organized

Split the window into [side-by-side or stacked panes](/features/panes), drag tabs between them, and each project keeps its own layout across restarts. With cmux, the app reuses workspaces by working directory, finds running sessions, picks a split direction, and names tabs after directories.

Bookmarks pin frequently used folders to the sidebar. Renaming a session syncs the new name back to the CLI, and deleting one moves it to a trash you can restore from.

## Understand usage and share results

The [statistics view](/features/stats) aggregates recorded token usage and estimated cost by project, model or tool using cached models.dev prices. These are not provider invoices. Antigravity's supported transcript has no usage fields. On macOS the menu bar shows today, 7-day and 30-day totals where usage is available.

One session or a batch can be [exported](/features/export-and-trash) as Markdown, HTML or parsed-message JSON. Exported text and embedded resources are readable locally; remote or unreadable local images are not guaranteed offline. Export reads source transcripts; rename, trash, restore and continuation have different write behavior. See [privacy and data handling](/guide/privacy).

## Supported agents

Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode. In-app chat is available for Claude Code and Codex. All seven have history, search, export and terminal resume; usage coverage varies by format. The [agents reference](/agents/) explains where each one stores its sessions on disk.
