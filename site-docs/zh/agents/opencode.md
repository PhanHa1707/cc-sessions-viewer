---
title: opencode 的会话记录存在哪
description: opencode 不用 JSONL，所有会话都在 ~/.local/share/opencode/opencode.db 这一个 SQLite 库里。表结构、关键的四张表，以及读记录的 SQL。
---

# opencode 的会话记录存在哪

此处支持的 opencode 布局把会话保存在 SQLite 库 `~/.local/share/opencode/opencode.db`；配置后改用 `$XDG_DATA_HOME/opencode/opencode.db`：

```
~/.local/share/opencode/opencode.db
```

它遵循 XDG 规范，所以设了 `$XDG_DATA_HOME` 的话以 `$XDG_DATA_HOME/opencode/opencode.db` 为准。macOS 上也一样，尽管 macOS 上大多数应用会用 `~/Library/Application Support`。

没有任何按会话拆分的文件。在 home 目录下 `grep -r` 是找不到 opencode 对话的，大部分人都是这么发现这件事的。

## 关键的四张表

```sql
project  -- id (sha1)、worktree（项目目录）、vcs、time_*
session  -- id（"ses_…"）、project_id、parent_id、slug、title、directory、
         -- model (JSON)、tokens_* 五列、cost、time_created、
         -- time_updated、time_archived
message  -- id（"msg_…"）、session_id、time_created、data（JSON 信封）
part     -- id（"prt_…"）、message_id、session_id、time_created、data（JSON 正文）
```

库里还有别的表（`workspace`、`todo`、`permission`、`event`、`credential` 以及迁移记录），但一份对话记录就是 `session` → `message` → `part`。

`message.data` 是 JSON 信封：`role`、`modelID`、`providerID`、`tokens{input,output,reasoning,cache{read,write}}`、`cost`、`time{created,completed}`。`part.data` 是正文，`type` 可能是 `text`、`reasoning`、`tool`、`file`、`step-start`、`step-finish` 等等。

## 子 agent 会话

`parent_id` 非空的会话是别的会话派生出来的子 agent 运行。它们是实打实、要花钱的 API 调用，但不是你主动开的对话。任何「列出我的会话」的地方都应该把它们过滤掉，而任何算总花费的地方都必须把它们算进去。

## 用只读方式打开

你读的时候 opencode 的 TUI 可能正在写这个库。SQLite 的 WAL 模式让并发读是安全的，但前提是你以只读打开、不去拿写锁：

```bash
sqlite3 "file:$HOME/.local/share/opencode/opencode.db?mode=ro" ".tables"
```

## 用 SQL 读 opencode 记录

按时间倒序列出会话，带项目和花费：

```sql
SELECT s.id, p.worktree, s.title, s.cost,
       datetime(s.time_created/1000, 'unixepoch') AS created
FROM session s
JOIN project p ON p.id = s.project_id
WHERE s.parent_id IS NULL
ORDER BY s.time_created DESC
LIMIT 20;
```

按顺序打印一个会话的文本：

```sql
SELECT json_extract(m.data, '$.role') AS role,
       json_extract(pt.data, '$.text') AS text
FROM message m
JOIN part pt ON pt.message_id = m.id
WHERE m.session_id = 'ses_...'
  AND json_extract(pt.data, '$.type') = 'text'
ORDER BY m.time_created, pt.time_created;
```

按项目统计花费：

```sql
SELECT p.worktree, ROUND(SUM(s.cost), 2) AS usd, COUNT(*) AS sessions
FROM session s JOIN project p ON p.id = s.project_id
GROUP BY p.worktree ORDER BY usd DESC;
```

最后这条故意把子 agent 会话算进去了，因为它们是账单的一部分。

## 为什么成本必须从库里取 {#cost-from-db}

opencode 可以挂任意 provider：DeepSeek、OpenRouter、本地模型，什么都行。按模型名查价目表推不出一次调用的真实成本，所以每条 assistant 消息里记着的 `modelID` 和 `cost` 才是唯一可信的来源。

## 怎么恢复这个会话

在项目目录运行 `opencode --session SESSION_ID`，需要已安装 opencode。应用提供[终端恢复](/zh/features/resume)，不提供 opencode 内置对话。

## 依据与限制

实现依据：[opencode 适配器](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/opencode.rs)。上游：[opencode 文档](https://opencode.ai/docs/)。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->

SQL 示例针对上述数据库结构，不覆盖旧的文件存储布局。只读查询不同于用户明确执行的重命名、回收、还原等数据库写入。见[找不到会话的排障指南](/zh/guide/troubleshooting)。

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 以只读方式查这个库，列表里藏掉子 agent 会话但统计里照算，把 opencode 的对话和那些 JSONL 的 agent 并排显示在同一个界面里。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi) 和 [Antigravity CLI](/zh/agents/antigravity-cli)。
