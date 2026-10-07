---
layout: home
title: Sessions Viewer — Claude Code、Codex、opencode 会话查看器
titleTemplate: false
description: 一个免费的桌面应用，把 Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI 和 opencode 的本地会话记录读进同一个界面，可阅读、搜索、恢复。

hero:
  name: Sessions Viewer
  text: 七种 CLI，一个工作区
  tagline: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI 和 opencode 各自把会话记录存在不同的地方、用不同的格式。Sessions Viewer 把它们全部读进同一套 项目 → 会话 → 对话 的视图。
  actions:
    - theme: brand
      text: 开始使用
      link: /zh/guide/
    - theme: alt
      text: 下载
      link: https://github.com/jerrywu001/cc-sessions-viewer/releases/latest
    - theme: alt
      text: GitHub
      link: https://github.com/jerrywu001/cc-sessions-viewer

features:
  - title: 阅读已记录上下文
    details: 阅读受支持的思考块、配对的工具调用与结果、结构化 diff 和已记录图片。呈现范围取决于 agent 格式和源数据是否保留。
    link: /zh/features/read-and-search
    linkText: 会话是怎么还原的
  - title: 跨项目搜索
    details: ⌘⇧F 跨当前 agent 的项目搜索标题和用户提问，也可切换为会话 ID 搜索。打开命中上下文，或用会话提问列表定位。
    link: /zh/features/read-and-search#finding-a-message
    linkText: 搜索与跳转提问
  - title: 从断点继续
    details: 使用对应 CLI 在内嵌或受支持的外部终端恢复会话。Claude Code 和 Codex 还支持应用内对话，可调整模型与权限。
    link: /zh/features/resume
    linkText: 恢复与继续
  - title: 项目文件编辑器
    details: 在全屏工作区浏览和搜索项目，编辑文本与 Markdown、预览文档，并查看主工作树和 linked worktree 的 Git 改动。
    link: /zh/features/project-editor
    linkText: 打开项目文件编辑器指南
  - title: Token 与成本统计
    details: 用缓存的 models.dev 价格按项目、模型、工具汇总已记录用量与估算成本，不等于服务商账单。macOS 显示有用量字段的今日 / 7 天 / 30 天汇总。
    link: /zh/features/stats
    linkText: 统计
  - title: 工具管理
    details: 七种 agent 的 skills、MCP 服务器、hooks 和指令文件集中在一个面板里。找出机器上重复的 skill 和断掉的链接，任何改动落盘前都先把要动的文件逐条列给你看。
    link: /zh/tools/
    linkText: 管理 skills、MCP 和 hooks
  - title: 本地浏览历史
    details: 历史解析、搜索和导出在本地进行。恢复和对话使用配置的 CLI 或服务商；更新、价格和额度功能可能联网。重命名、回收及配置编辑是主动写入操作。
    link: /zh/guide/privacy
    linkText: 隐私与数据处理
---

## Sessions Viewer 是什么

Sessions Viewer 是免费的 MIT 开源桌面应用，支持 macOS、Windows、Linux，可阅读、搜索、导出本地 coding agent 历史。七种 agent 都能在终端恢复；应用内对话支持 Claude Code 和 Codex。

有具体问题？查看[路径、格式与恢复命令对比](/zh/agents/)、[找不到会话的排障指南](/zh/guide/troubleshooting)或[隐私与联网行为](/zh/guide/privacy)。

## 先试用免费浏览器工具 {#browser-tools}

安装桌面应用前，先计算 Token 价格情景或检查保存的记录用量。

- [Claude Code 成本计算器](/zh/tools/claude-code-cost-calculator) · [Claude Code Token 计数器](/zh/tools/claude-code-token-counter)

## 任务指南与验证依据 {#task-guides}

- [查找、阅读、导出并继续 Claude Code 会话](/zh/guide/claude-code-session-viewer)
- [定位 Codex rollout 项目并恢复对话](/zh/guide/codex-session-viewer)
- [复用 skill 与修复链接](/zh/tools/share-skills) · [检查 MCP 配置](/zh/tools/check-mcp)
- [兼容矩阵与可下载合成样例](/zh/guide/compatibility)
- [项目身份与文档维护](/zh/guide/about)

## 各家 agent 的会话记录在哪

Sessions Viewer 在原位读取每个 CLI 本来就在写的那些文件。参考页记录了每一种布局，并给出不装应用也能读记录的 `jq` 和 `sqlite3` 命令。

| Agent | 默认位置 | 格式 |
| --- | --- | --- |
| [Claude Code](/zh/agents/claude-code) | `~/.claude/projects/` | 一个会话一个 JSONL 文件 |
| [Codex](/zh/agents/codex) | `~/.codex/sessions/` | 一个会话一个 JSONL，按日期分桶 |
| [Grok Build](/zh/agents/grok-build) | `~/.grok/sessions/` | 一个会话一个目录 |
| [Kimi Code](/zh/agents/kimi-code) | `~/.kimi-code/sessions/` | 一个会话一个目录 |
| [Pi](/zh/agents/pi) | `~/.pi/agent/sessions/` | 一个会话一个 JSONL 文件 |
| [Antigravity CLI](/zh/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 一个对话一个目录 |
| [opencode](/zh/agents/opencode) | `~/.local/share/opencode/opencode.db` | 一个 SQLite 库 |

应用免费、开源，基于 MIT 许可证，支持 macOS、Windows 和 Linux。[下载最新版本](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)，或者从[指南](/zh/guide/)开始。
