---
title: Privacy and data handling in Sessions Viewer
description: What stays local when browsing coding-agent history, when chat and integrations use the network, and which explicit actions change files or databases.
---

# Is Sessions Viewer entirely offline?

**History parsing, search and export run locally. The whole app is not network-free.** Continuing a session uses the configured CLI/provider; updates, model prices and subscription usage can also make network requests. The distinction matters when working with confidential transcripts.

## What reads data, and what writes it?

| Action | Data handling |
| --- | --- |
| Browse, search, calculate local transcript statistics | Read session files or query the opencode database read-only; local caches/settings may be written |
| Export | Write a local output file; this is not automatic publishing |
| Rename | Update agent-specific title data; some agents append a title record or update a database |
| Move to trash / restore | Move files or directories, or change opencode database rows; permanent trash removal deletes the retained copy |
| Resume in a terminal / continue in chat | Start the CLI; it can append history, call a provider and run permitted tools |
| Project file editor / tool management | Explicitly edit project files, skills, MCP, hooks or instruction configuration |

“Read-only browsing” does not mean every feature is read-only. Back up important agent data before destructive actions. See [export and trash](/features/export-and-trash).

## When can the app use the network?

- **Chat and resumed CLI sessions:** prompts, context and attachments may be sent to the configured provider. Local providers have their own behavior; an in-app chat is not inherently offline.
- **Version checks and updates:** requests go to GitHub release/update endpoints. Background version checks can run at startup.
- **Model prices:** the price catalog is fetched from the js-bridge models.dev mirror, with models.dev as a fallback. The request fetches a catalog; local cost calculation does not require sending transcript text.
- **Subscription usage:** Claude/Codex usage features use account credentials or the CLI's authenticated account to request quota information. These are separate from reading local history.
- **MCP, hooks, shell commands and external links/images:** behavior depends on the configured tools and referenced services. Check their permissions and privacy policies.

Remote services receive ordinary request metadata such as an IP address. Local history browsing is not a promise that the app, a CLI or an integration will never connect to the internet.

## Before sharing an export or reporting a bug

Review prompts, tool output, screenshots, absolute paths and attachments for secrets or personal data. Exported JSON is the viewer's parsed message data, **not a byte-for-byte backup of every native agent file**. Keep the originals if you need a complete backup.

For bug reports, prefer a minimal synthetic sample that preserves the record shape. Do not attach an entire transcript, database, `auth.json`, API key, account token or unredacted diagnostic log. Share only the fields needed to reproduce the problem.

## Implementation evidence

Checked against Sessions Viewer 0.6.0 source on 2026-10-05; this is an implementation description, not an independent security audit:

- [Agent readers and explicit data operations](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents)
- [Local export implementation](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src/export.ts)
- [Chat process integration](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agent_chat.rs)
- [Background update checks](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src/updateCheck.ts)
- [Price catalog requests](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/stats/pricing.rs)
- [Claude quota requests](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/usage_api.rs) / [Codex quota integration](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/codex_usage.rs)

Start with the [guide](/guide/), [session format comparison](/agents/) or [installation instructions](/guide/install).
