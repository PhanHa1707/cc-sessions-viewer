---
title: About the Sessions Viewer Project
description: Learn who maintains Sessions Viewer, its MIT license and public source, and how documentation claims are checked without promising CLI certification.
---

# About Sessions Viewer

Sessions Viewer is an independent, MIT-licensed desktop application for local coding-agent history and tool configuration. Its public repository is [jerrywu001/cc-sessions-viewer](https://github.com/jerrywu001/cc-sessions-viewer). It is not an official product of Anthropic, OpenAI or the other agent vendors.

## Project and maintenance {#maintenance}

- **Project name:** Sessions Viewer. The repository retains the older `cc-sessions-viewer` name.
- **Canonical docs:** [sessions-viewer.js-bridge.com](https://sessions-viewer.js-bridge.com).
- **Source and license:** [GitHub](https://github.com/jerrywu001/cc-sessions-viewer) and [MIT license](https://github.com/jerrywu001/cc-sessions-viewer/blob/main/LICENSE).
- **Installers and release notes:** [Releases](https://github.com/jerrywu001/cc-sessions-viewer/releases). Downloads and docs may change independently; check your installed version.
- **Maintenance:** the repository README describes spare-time maintenance. There is no response-time or commercial support guarantee stated here.

## How documentation claims are checked {#documentation-evidence}

This documentation pass reviewed version 0.6.0, source revision `22fefc6`, on 2026-10-05. Agent references link the implementation they describe. Command regressions run documented `jq`/SQL against public synthetic data, without reading private sessions or executing provider/resume requests.

The [compatibility matrix](/guide/compatibility) distinguishes source review, command tests and CLI runtime validation. Where a CLI release has not been executed end-to-end, it is marked unvalidated. Review dates identify a real documentation review; they are not an automatic promise of fresh upstream compatibility.

## Report an issue or improve a page {#feedback}

Use [GitHub issues](https://github.com/jerrywu001/cc-sessions-viewer/issues) for reproducible bugs or documentation corrections, or submit a pull request. Include app/CLI version, OS, affected operation and a minimal synthetic or redacted record. Never paste API keys, unredacted transcripts or a private database into a public issue.

Before sharing exports or configuration screenshots, read [privacy and data handling](/guide/privacy). For the intended workflow, start with [Claude Code sessions](/guide/claude-code-session-viewer), [Codex sessions](/guide/codex-session-viewer) or [tool management](/tools/).
