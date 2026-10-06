---
title: Kimi Code 的会话记录存在哪
description: Kimi Code 一个会话一个目录，放在 ~/.kimi-code/sessions/ 下，state.json 是元数据，agents/main/wire.jsonl 是记录本体。目录结构，以及用 jq 读会话的命令。
---

# Kimi Code 的会话记录存在哪

Kimi Code 的主记录是会话目录里的 `agents/main/wire.jsonl`，默认位于 `~/.kimi-code/sessions/`；`KIMI_CODE_HOME` 可以改数据根目录：

```
$KIMI_CODE_HOME/sessions/wd_<名字>_<哈希>/session_<uuid>/
```

`KIMI_CODE_HOME` 默认 `~/.kimi-code`。那个目录的根上还有一份扁平索引：

```
~/.kimi-code/session_index.jsonl
```

## wd_ 分组目录

`wd_` 是 working directory 的意思，后面跟的是项目文件夹自己的名字，再加上完整路径的一段短哈希：

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

那段哈希让两个都叫 `blog` 但在不同父目录下的项目不会落进同一个桶，所以光看目录列表就能把项目分开。

## Kimi Code 的会话目录里有什么

```
state.json                 ← 会话元数据
agents/main/wire.jsonl     ← 记录本体
logs/
media/
```

`agents/main/` 下面的 `wire.jsonl` 是主记录。之所以多一层 `agents/`，是因为一个会话可以跑不止一个 agent，`main` 是你实际对话的那个。

## 在终端里读 Kimi Code 会话

列出索引中的会话 ID 和标题；索引不是对话正文：

```bash
jq -r '[.sessionId, .title] | @tsv' ~/.kimi-code/session_index.jsonl
```

从主事件格式提取用户提问和助手文本：

```bash
jq -r 'if .type=="turn.prompt" then
    select((.origin.kind // "user")=="user") | .input
    | if type=="string" then . else .[]? | select(.type=="text") | .text end
  elif .type=="context.append_loop_event" and .event.type=="content.part" then
    .event.part | select(.type=="text") | .text
  else empty end' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

看某个会话的元数据：

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## 怎么恢复这个会话

在项目目录运行 `kimi --session SESSION_ID`，需要已安装 Kimi Code。应用提供[终端恢复](/zh/features/resume)，不提供 Kimi 内置对话。

## 依据与限制

实现依据：[Kimi Code 适配器](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/kimi.rs)。上游：[Kimi Code 仓库](https://github.com/MoonshotAI/kimi-cli)。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->

旧的 `context.append_message` 使用另一种结构，适配器有回退逻辑；上述命令只适用于主事件格式，不合并工具输出。见[找不到会话的排障指南](/zh/guide/troubleshooting)。

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 把 `wire.jsonl` 读进和其它 agent 相同的对话视图，`media/` 里的附件内联显示，重命名和删除都以会话目录为单元。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
