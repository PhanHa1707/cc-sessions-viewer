---
title: Pi 的会话记录存在哪
description: Pi 默认把 JSONL 会话存到 ~/.pi/agent/sessions/。说明配置目录的优先级、嵌套消息文本读取及按文件路径恢复的方法。
---

# Pi 的会话记录存在哪

Pi 默认把会话放在 `~/.pi/agent/sessions/`。一个会话一个 JSONL 文件，包含 `session` 头和消息／会话树条目：

```
<会话根目录>/--<编码过的项目路径>--/<时间戳>_<uuid>.jsonl
```

真实路径长这样：

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

文件名以 ISO 8601 时间戳打头，所以直接 `ls` 出来就是按时间排好的。

## 会话根目录怎么定

Pi 的根目录有三个地方可以配，优先级从高到低：

1. `PI_CODING_AGENT_SESSION_DIR` 环境变量（设了且非空）
2. `<agent 目录>/settings.json` 里的 `sessionDir`
3. 默认值，`<agent 目录>/sessions`

agent 目录本身由 `PI_CODING_AGENT_DIR` 指定，默认 `~/.pi/agent`。所以什么都不配的话，会话就在 `~/.pi/agent/sessions`。

一次性的 `--session-dir` 可能把记录写到 Sessions Viewer 扫描范围之外。文件可能存在，只是应用未发现；应对齐根目录配置，不要把“未显示”当作“已删除”。

## 项目目录名怎么来的

项目绝对路径把 `/` 换成 `-`，前后各裹一对 `--`：

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

目录名只是线索，不是可逆编码。适配器以文件首条 `session` 记录中的 `cwd` 确认项目。

## agent 目录里还有什么

```
~/.pi/agent/
├── sessions/
├── extensions/          ← 生命周期扩展
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← 凭据，别读这个
```

查阅会话应读取会话文件，而不是凭据文件。Sessions Viewer 还会读 `settings.json` 来解析自定义根目录；工具管理是另一项功能。

## 在终端里读 Pi 会话

提取文件中存储的用户／助手文本，包含存储的分支，不限当前分支：

```bash
jq -r 'select(.type=="message") | .message
  | select(.role=="user" or .role=="assistant") | .content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

某个项目最近的一个会话：

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

按项目统计会话数：

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## 怎么恢复这个会话

在项目目录运行 `pi --session "/absolute/path/to/session.jsonl"`，需要已安装 Pi。恢复参数是**文件路径**，不只是 UUID。应用提供[终端恢复](/zh/features/resume)，不提供 Pi 内置对话。

## 依据与限制

实现依据：[Pi 适配器](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/pi.rs)。上游：[Pi 文档入口](https://pi.dev/)。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->

Pi 用条目 ID 和父 ID 保存分支。上述命令按文件顺序提取存储文本，不会还原当前分支。见[找不到会话的排障指南](/zh/guide/troubleshooting)。

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 按和 Pi 一样的顺序解析会话根目录，先看环境变量，再看 `settings.json`，最后用默认值，并且只读会话记录，绝不碰旁边的 auth 和凭据文件。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
