---
title: Coding agent 会话记录对比：位置、格式与恢复命令
description: 对比 Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode 的记录路径、格式、恢复命令及 Sessions Viewer 支持范围。
---

# 各家 coding agent 的会话记录存在哪

Claude Code 和 Codex 的 JSONL 默认在 `~/.claude/projects/` 和 `~/.codex/sessions/`，Pi 在 `~/.pi/agent/sessions/`。Grok Build、Kimi Code、Antigravity CLI 以目录保存会话；此处支持的 opencode 布局使用一个 SQLite 库。下面对比默认路径、项目信息和恢复方式。

## 默认位置与格式

| Agent | 默认位置 | 记录本体 |
| --- | --- | --- |
| [Claude Code](/zh/agents/claude-code) | `~/.claude/projects/` | `<项目>/<会话 id>.jsonl` |
| [Codex](/zh/agents/codex) | `~/.codex/sessions/` | `<YYYY>/<MM>/<DD>/rollout-*.jsonl`；归档在 `~/.codex/archived_sessions/` |
| [Grok Build](/zh/agents/grok-build) | `~/.grok/sessions/` | `<分组>/<会话 id>/updates.jsonl` |
| [Kimi Code](/zh/agents/kimi-code) | `~/.kimi-code/sessions/` | `<分组>/<会话 id>/agents/main/wire.jsonl` |
| [Pi](/zh/agents/pi) | `~/.pi/agent/sessions/` | `<项目>/<时间戳>_<uuid>.jsonl` |
| [Antigravity CLI](/zh/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | `<uuid>/.system_generated/logs/transcript*.jsonl` |
| [opencode](/zh/agents/opencode) | `~/.local/share/opencode/opencode.db` | SQLite：`session` → `message` → `part` |

## 怎么恢复会话 {#resume-commands}

在原项目目录执行，需要已安装并配置对应 CLI。把 `SESSION_ID`、`CONVERSATION_ID` 或路径换成实际值；这些命令会启动 CLI，可能调用服务商或写入数据。

| Agent | 终端命令 | 应用内对话 |
| --- | --- | --- |
| Claude Code | `claude --resume SESSION_ID` | 支持 |
| Codex | `codex resume SESSION_ID` | 支持 |
| Grok Build | `grok --resume SESSION_ID` | 不支持 |
| Kimi Code | `kimi --session SESSION_ID` | 不支持 |
| Pi | `pi --session "/absolute/path/to/session.jsonl"` | 不支持 |
| Antigravity CLI | `agy --conversation CONVERSATION_ID` | 不支持 |
| opencode | `opencode --session SESSION_ID` | 不支持 |

七种 agent 都提供历史浏览、搜索、导出与终端恢复。统计取决于记录是否含用量字段：此处支持的 Antigravity CLI 记录没有这些字段。操作见[恢复与继续](/zh/features/resume)、[导出与回收站](/zh/features/export-and-trash)。

## 项目信息来自哪里

| Agent | 查看器采用的元数据 |
| --- | --- |
| Claude Code | JSONL 中的 `cwd`；编码目录名只是回退，不是可逆路径 |
| Codex | `session_meta.payload.cwd` |
| Grok Build | `summary.json` → `info.cwd`，缺失时回退到分组目录线索 |
| Kimi Code | 会话元数据／索引；`state.json.cwd` 标识工作目录 |
| Pi | 首条 `session` 记录的 `cwd` |
| Antigravity CLI | `history.jsonl` → `workspace` |
| opencode | `project` 表，按 `session.project_id` 关联 |

## 查看器识别哪些自定义根目录

| Agent | 支持的配置 |
| --- | --- |
| Grok Build | `GROK_HOME`，默认 `~/.grok` |
| Kimi Code | `KIMI_CODE_HOME`，默认 `~/.kimi-code` |
| Pi | 依次取 `PI_CODING_AGENT_SESSION_DIR`、`settings.json.sessionDir`、`<PI_CODING_AGENT_DIR>/sessions` |
| opencode | `XDG_DATA_HOME`，默认 `~/.local/share` |

当前 Claude Code、Codex、Antigravity 适配器读取 home 下的固定位置。这是**查看器的限制**，不代表 CLI 不能配置其他目录。从 Finder 或快捷方式打开的应用可能收不到 shell 中的环境变量。移动文件前先按[排障清单](/zh/guide/troubleshooting)检查。

## 不装应用怎么读取

各 agent 参考页都有 `jq` 或只读 `sqlite3` 示例。这些命令只提取部分字段，不完整还原图片、工具结果或分支。想用可搜索的界面，可以查看 [Sessions Viewer 指南](/zh/guide/)或[下载安装](/zh/guide/install)。

## 依据与范围

路径与恢复命令已对照[源码版本 22fefc6 的适配器](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents)核对。各参考页另列对应实现，以及已确认的上游入口。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->
