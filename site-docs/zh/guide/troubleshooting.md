---
title: Sessions Viewer 找不到会话记录怎么办
description: 按顺序排查 agent 数据目录、桌面环境变量、Codex 归档、项目路径和记录格式，不盲目移动文件，不公开私人会话。
---

# 为什么找不到我的会话记录

先检查**数据根目录、项目归属和记录格式**。CLI 可能写到了查看器不扫描的位置，归档或项目路径不同也会让记录不在预期列表里。空列表不代表文件已删除。

## 1. 预期位置有没有记录

按[路径与格式对比](/zh/agents/)找到对应 agent 参考页，对一个已知文件执行该页的只读命令。不要搜索凭据文件，也不要把私人数据复制到公开 issue。

- 没有文件：确认 CLI 保存过会话，且使用的是同一个系统用户／home 目录。
- 文件在其他地方：先对比实际根目录与查看器支持的配置，不要直接搬文件。
- opencode 有数据库：用 `mode=ro` 只读查询，不要去找 JSONL。

## 2. 桌面应用收到相同配置了吗

对照[支持的根目录](/zh/agents/)，检查 Grok、Kimi、Pi、opencode 的 `GROK_HOME`、`KIMI_CODE_HOME`、`PI_CODING_AGENT_DIR`、`PI_CODING_AGENT_SESSION_DIR`、`XDG_DATA_HOME`。Pi 还会读取 `settings.json.sessionDir`。

终端里 export 的环境变量不一定会传给 Finder 或快捷方式打开的应用。对齐启动环境后重启应用，再检查列表；不要因此盲目改全局环境变量。

当前 Claude Code、Codex、Antigravity 读取 home 下的固定位置，不会自动扫描其他 CLI 根目录。保留原始备份；改进查看器的发现规则，比随意搬动正在使用的数据更安全。

## 3. 是否归档、改名或属于其他项目

- **Codex 归档：**检查 `~/.codex/archived_sessions/` 并开启应用的归档会话显示。继续前可能需要先在 Codex 中取消归档。
- **项目路径变化：**新路径、linked worktree、符号链接或旧工作区可能被归到其他项目。按[项目元数据对照](/zh/agents/)检查，不要只猜目录名。
- **标题不熟悉：**用全局搜索查一段独特的提问，不要只依赖会话标题。
- **回收站：**如果曾在应用里主动删除，先检查[共享回收站](/zh/features/export-and-trash)，再决定是否重建。

## 4. 格式是否支持、文件是否可读

在备份或不再写入的文件上只读检查：

- JSONL 每条记录应是可解析的 JSON；正在写入的最后一行可能暂时不完整。
- Codex 首条应为 `session_meta`；Pi 首条应是含 ID、时间戳、`cwd` 的 `session` 头。
- Grok 的可见流是 `updates.jsonl`，不是 `chat_history.jsonl`；Kimi 主记录是 `agents/main/wire.jsonl`。
- Antigravity 两份 transcript 都可能被压缩，先看较大的文件，但两份都丢失的内容无法凭空恢复。
- opencode 旧文件布局或变化后的 SQLite schema 可能需要更新适配器。

确认当前用户能读取文件和父目录，不要绕过权限，也不要为了让解析器接受而直接改原始记录。

## 5. 报告问题时提供什么

提供应用版本、CLI 版本、系统、预期目录结构、是否自定义根目录，以及展示失败格式的最小合成记录。用户名和项目路径要脱敏，说明会话是否仍在运行或已归档。不要附凭据或整个私人数据库，见[隐私与数据处理](/zh/guide/privacy)。

可以[提交 issue](https://github.com/jerrywu001/cc-sessions-viewer/issues)或[下载最新版](/zh/guide/install)。上述发现规则于 2026-10-05 对照[源码版本 22fefc6](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents)核对，不代表测试过每个 CLI 版本。
