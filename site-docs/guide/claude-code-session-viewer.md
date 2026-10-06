---
title: How to find, read, export and resume Claude Code sessions
description: A local Claude Code session-viewer workflow for finding old prompts, inspecting tool results, exporting parsed conversations and resuming with the CLI or in-app chat.
image: /screenshots/search.png
---

# Find and continue a Claude Code session

Use Sessions Viewer when you remember what a Claude Code conversation was about but not which JSONL file contains it. It groups local history by project, searches messages, replays supported tool results and can hand a session back to Claude Code. Install from [the release page](/guide/install); this is an independent open-source app, not an Anthropic product.

## 1. Find the project and the prompt {#find}

1. Open Sessions Viewer and choose the project's history view.
2. Use global search (`⌘⇧F` on macOS) for a distinctive phrase from the conversation. Selecting a match opens the session and jumps to that message.
3. If you know the session but not the point in it, use the prompt list or in-view search (`⌘F`). For other platforms, see [shortcut labels](/features/shortcuts).

![Global search finds matching messages across local projects](/screenshots/search.png)

Claude Code usually stores records under `~/.claude/projects/<encoded-project>/<uuid>.jsonl`. File paths, message blocks and tool-result shapes are explained in the [storage reference](/agents/claude-code). If the project is missing, check the configured data root and [missing-session checklist](/guide/troubleshooting), not just the folder's encoded name.

## 2. Read the context before continuing {#read}

Inspect the user prompt, assistant answer and paired tool calls/results. Expand thinking only when needed. When a tool result includes `structuredPatch`, the viewer can render a diff rather than escaped JSON. Images and tools depend on what the source recorded; a plain-text extraction does not reproduce them.

![History replay with paired calls and structured changes](/screenshots/chat.png)

Reading and searching do not rewrite the original transcript. Renaming, trash/restore, project editing and continued chat are different operations; see [data handling](/guide/privacy).

## 3. Export an answer, not a native-file backup {#export}

Use the session export action: Markdown for readable notes, HTML for an offline page, or JSON for parsed messages. Review the output before sharing: prompts, code, file paths and tool output can contain private data. The export is not a byte-for-byte backup of Claude's JSONL; retain native files if you need one. See [export options](/features/export-and-trash).

## 4. Resume the existing work {#resume}

In the project directory, the native CLI command is:

```bash
claude --resume SESSION_ID
```

Replace `SESSION_ID` with the actual saved ID. Sessions Viewer can launch this in the embedded terminal or your selected external terminal, and supports Claude Code in-app chat. Install/configure/authenticate the CLI first; the app is not a replacement for a provider account. Continuing can contact the provider, write history and run tools. Check the project and permission settings before sending. See [resume behavior](/features/resume).

## Manual JSONL or a viewer? {#manual-vs-gui}

| Task | Manual inspection | Sessions Viewer |
| --- | --- | --- |
| Confirm one recorded field | `jq` is quick and transparent | Inspect rendered context alongside the message |
| Find an old prompt across projects | Find files and write filters | Global search and prompt navigation |
| Read tool use, results and patches | Join records by ID yourself | Paired tool results and supported diff rendering |
| Continue work | `claude --resume` with the saved ID | Terminal handoff or supported in-app chat |

For a safe command exercise, download the [synthetic Claude sample and expected output](/guide/compatibility#synthetic-samples). These samples are extraction fixtures, not real resumable sessions. The [reference page](/agents/claude-code) has the `jq` filters.

## When it does not work {#limits}

- **No session:** check root settings, user account and whether the CLI actually saved a transcript.
- **Missing image/tool/diff:** inspect the original record shape; not every layout supplies the same fields.
- **Resume fails:** verify ID, project path, CLI installation/authentication and terminal configuration.
- **Cost looks wrong:** recorded usage and catalog prices are estimates, not invoices; see [statistics](/features/stats).

Scope: source reviewed against 0.6.0 on 2026-10-05; no particular Claude Code CLI release was end-to-end tested in this documentation pass. See the [evidence matrix](/guide/compatibility).
