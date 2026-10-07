<div align="center">

# Sessions Viewer

[![Version](https://img.shields.io/github/v/release/jerrywu001/cc-sessions-viewer?color=blue&label=version)](https://github.com/jerrywu001/cc-sessions-viewer/releases)
[![Star on GitHub](https://img.shields.io/github/stars/jerrywu001/cc-sessions-viewer?style=flat&logo=github&label=Star%20on%20GitHub)](https://github.com/jerrywu001/cc-sessions-viewer)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/jerrywu001/cc-sessions-viewer/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/jerrywu001/cc-sessions-viewer/total)](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**English** · [中文](README.zh-CN.md) · [日本語](README.ja.md) · [**Documentation**](https://sessions-viewer.js-bridge.com) · [CHANGELOG](CHANGELOG.md)

<p align="center">A native desktop browser for <strong>Claude Code</strong>, <strong>Codex</strong>, <strong>Grok Build</strong>, <strong>Kimi Code</strong>, <strong>Pi</strong>, <strong>Antigravity CLI</strong>, and <strong>opencode</strong>.<br/>Read, search, and manage local session transcripts from all seven in one place.</p>

<p align="center">Plus a <strong>tool management</strong> page — round up the skills scattered across your agents (duplicates, dead links, the same one stored three times),<br/>and take over MCP servers, hooks, and instruction files. <a href="https://sessions-viewer.js-bridge.com/tools/"><strong>Guide →</strong></a></p>

</div>

https://github.com/user-attachments/assets/9bcb92a8-e5b8-40e5-b492-af252162309b

---

## What it does

Sessions Viewer turns local agent transcripts into a searchable workspace. Open a project, inspect supported recorded context, then continue the work from the same place without manually hunting through JSONL files.

> [!TIP]
> **New — Tool management.** Skills, MCP servers, hooks, and instruction files for all seven agents in one place. Find the duplicate skills and broken links on your machine and repair them, inspect cached MCP context estimates, and preview file edits. Review hook commands before testing: a dry-run executes the script, not a sandbox.
>
> → **[Read the tool management guide](https://sessions-viewer.js-bridge.com/tools/)**

### Read and find context

- **Recorded context** — view supported thinking blocks, paired tools, structured diffs and recorded images; coverage depends on the source format.
- **Global search** — with `⌘⇧F`, search titles and saved user prompts across the selected agent's projects, or switch to session-ID mode. Assistant answers and tool output are not matched.
- **Jump to prompt** — scan every user prompt in a compact list, then scroll and flash the selected message.
- **Views history** — revisit recent read and chat views, with per-project search and favorites.

### Continue the work

- **Built-in chat** — start or resume Claude Code and Codex sessions with model, reasoning-effort (including Opus **Ultracode**), and permission-mode controls.
- **One-click resume** — open a session in an embedded terminal or in **Terminal.app**, **cmux**, **iTerm2**, **Ghostty**, or **Warp**.
- **Shell tabs** — run regular shell commands beside agent sessions. Restart can restore tab titles/directories with a new shell, not the previous process or running command.
- **Launch arguments** — configure per-agent CLI flags such as `--dangerously-skip-permissions` for new and resumed sessions.

### Keep projects organized

- **Split panes** — arrange side-by-side or stacked panes, drag tabs between panes, and keep each project's layout across restarts.
- **cmux integration** — reuse workspaces by working directory, find running sessions, choose smart split directions, and name tabs after directories.
- **Bookmarks** — pin frequently used folders to the sidebar for quick access.
- **Rename and trash** — sync session renames back to the CLI and soft-delete sessions with restore support.

### Understand usage and share results

- **Stats and pricing** — inspect recorded token usage and estimated cost by project, model, or tool using cached models.dev prices; macOS menu bar stats show Today / 7d / 30d totals where usage is available. Estimates are not provider invoices.
- **Flexible export** — save Markdown, HTML, or parsed-message JSON. Remote or unreadable local images may remain linked; keep native files for a complete backup.
- **Read-only browsing** — reading, searching and exporting do not rewrite source transcripts. Rename, trash/restore, continuation and editing are separate write operations.

History processing is local; the whole app is not network-free. Online chat/resume uses your configured CLI/provider, and updates, prices and quota features can make requests. See [privacy and data handling](https://sessions-viewer.js-bridge.com/guide/privacy).

### Supported session sources

Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI, and opencode. All seven provide history, search, export and terminal resume. In-app chat is available only for Claude Code and Codex. Usage statistics depend on recorded fields; the supported Antigravity transcript has none.

Where each one stores its sessions on disk, with commands for reading a transcript by hand, is documented at [sessions-viewer.js-bridge.com/agents/](https://sessions-viewer.js-bridge.com/agents/).

Task guides: [Claude Code history](https://sessions-viewer.js-bridge.com/guide/claude-code-session-viewer) · [Codex rollouts](https://sessions-viewer.js-bridge.com/guide/codex-session-viewer) · [compatibility and synthetic samples](https://sessions-viewer.js-bridge.com/guide/compatibility) · [project and maintenance](https://sessions-viewer.js-bridge.com/guide/about).

## Screenshots

<details>
  <summary>Open the visual tour</summary>

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/cover.png" alt="Main view — sidebar, sessions, and chat" />
      <p align="center"><em>Main view — sidebar, sessions, chat</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/chat.png" alt="Faithful replay — thinking, tool calls, structured diffs" />
      <p align="center"><em>Faithful replay — thinking, tool calls, structured diffs</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/split-screen.png" alt="Split panes — multiple sessions side by side" />
      <p align="center"><em>Split panes — multiple sessions side by side, drag tabs between panes</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/chat-preview.png" alt="In-app chat — Mermaid, tables, file mentions and image attachments" />
      <p align="center"><em>In-app chat — Mermaid & tables, @-mention files, attach images</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/session-resume.png" alt="Embedded terminal resume" />
      <p align="center"><em>Embedded terminal — one-click resume or new session</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/search.png" alt="Global search overlay" />
      <p align="center"><em>Global search (⌘⇧F) opens matching sessions and user prompts</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/stats.png" alt="Token & cost analytics" />
      <p align="center"><em>Token & cost analytics by project, model, tool</em></p>
    </td>
    <td width="50%">
      <img src="src/assets/sys-stats.png" alt="Menu bar stats — per-agent cost and token overview" />
      <p align="center"><em>Menu bar stats — per-agent cost & token overview</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/model-price.png" alt="Live model pricing table" />
      <p align="center"><em>Live model pricing</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/trash.png" alt="Shared trash with restore" />
      <p align="center"><em>Shared trash — soft-delete with one-click restore</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="src/assets/settings.png" alt="Settings — terminal picker and launch arguments" />
      <p align="center"><em>Settings — terminal picker & launch arguments</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/export.png" alt="Exported HTML preview" />
      <p align="center"><em>Exported HTML — readable in a browser; images may remain external</em></p>
    </td>
  </tr>
</table>

</details>

## Install

Grab the latest installer from [Releases](https://github.com/jerrywu001/cc-sessions-viewer/releases), or follow the [installation guide](https://sessions-viewer.js-bridge.com/guide/install):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon + Intel) | `.dmg` |
| Windows x64 | `-setup.exe` / `.msi` |
| Linux x86_64 | `.deb` / `.AppImage` |

> [!IMPORTANT]
> **macOS: this build is not notarized.** It is ad-hoc signed, so Gatekeeper blocks the
> first launch with *"Apple could not verify 'Sessions Viewer' is free of malware."*
> Apple has not verified this build; the warning does not prove the download is safe.
> Only proceed if you deliberately obtained and trust the installer from this project's Releases.
>
> **macOS 15 Sequoia and later** — Control-click → Open no longer works, Apple removed
> that bypass:
> 1. Double-click the app once and dismiss the warning.
> 2. Open **System Settings → Privacy & Security** and scroll to the bottom.
> 3. Next to *"Sessions Viewer" was blocked*, click **Open Anyway** and authenticate.
> 4. Launch the app again and click **Open**.
>
> **macOS 14 Sonoma and earlier** — Control-click (right-click) the app in Finder →
> **Open** → **Open** in the dialog. Once is enough.
>
> **From Terminal, only for a trusted download:** this removes the quarantine attribute
> and bypasses that Gatekeeper check. Prefer the System Settings flow above.
> ```bash
> xattr -dr com.apple.quarantine "/Applications/Sessions Viewer.app"
> ```
> If it reports `Operation not permitted`, check ownership and installation location instead of blindly elevating permissions.

On Linux the `.AppImage` is portable — `chmod +x` and run. The `.deb` installs with:
```bash
sudo apt install ./cc-sessions-viewer_<ver>_amd64.deb
```

## Development

```bash
git clone https://github.com/jerrywu001/cc-sessions-viewer.git
cd cc-sessions-viewer
npm install
npm run tauri dev      # dev mode
npm run tauri build    # bundle
```

Prereqs: latest Node 22, Rust stable. See [`CLAUDE.md`](CLAUDE.md) for architecture notes.

## Contributing

PRs welcome. Please use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, ...).

## Star History

<a href="https://www.star-history.com/?type=date&repos=jerrywu001/cc-sessions-viewer">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&legend=top-left" />
 </picture>
</a>

## Sponsorship Support
This project is maintained in my spare time. Sponsorship helps cover ongoing development, bug fixes, and documentation.

- 🛠️ Continuous development and updates

- 🐛 Swift bug fixes and issue resolution

- 📚 Documentation improvements and expanded examples

For custom work or other special requests, contact me through one of the sponsorship options below. Requests start at US$50 and depend on current availability.

### Ways to contribute:

- GitHub Sponsors
  
[GitHub Sponsors](https://github.com/sponsors/jerrywu001) (Recommended · Zero fees)

- Alipay/Wechat
  
<table style="display: flex; width: 500px;">
  <tr>
    <td style="margin-right: 16px;">
      <img style="width: 150px;" src="https://www.js-bridge.com/alipay.jpg" />
    </td>
    <td style="margin-right: 16px;">
      <img style="width: 150px;" src="https://www.js-bridge.com/wechat.jpg" />
    </td>
  </tr>
</table>

## License

[MIT](LICENSE) © jerrywu001 · [@jerrywu185](https://x.com/jerrywu185)

> Friend link: [linux.do](https://linux.do/)
