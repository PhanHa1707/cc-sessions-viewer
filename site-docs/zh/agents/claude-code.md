---
title: Claude Code 的会话记录存在哪
description: Claude Code 把每个会话写成 ~/.claude/projects/ 下的一个 JSONL 文件。目录结构、记录格式、结构化 diff，以及在终端里用 jq 直接读会话的命令。
---

# Claude Code 的会话记录存在哪

Claude Code 把每个会话存成 home 目录下的一个 JSONL 文件：

```
~/.claude/projects/<项目目录>/<会话 id>.jsonl
```

`<会话 id>` 就是传给 `claude --resume` 的 UUID。部分 CLI 版本还会维护 `sessions-index.json`；Sessions Viewer 扫描 JSONL 不要求这个索引存在。

## 项目目录名怎么来的

Claude Code 把项目的绝对路径里每一个 `/` 换成 `-`，开头那个也换，得到目录名：

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

Windows 的路径分隔符和盘符冒号也会替换（`E:\work\blog` → `E--work-blog`）。名称中本来就有短横线时，编码不能反向还原；确认项目应优先看记录里的 `cwd`，不要只猜目录名。

## Claude Code 的一条记录长什么样

一行一个 JSON 对象，用 `type` 区分：

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

整段对话都在 `message.content` 这个数组的块里：

| 块 `type` | 内容 |
| --- | --- |
| `text` | 普通文本 |
| `thinking` | 扩展思考（模型产生了才有） |
| `tool_use` | 一次工具调用：`name` 加一个 `input` 对象 |
| `tool_result` | 结果，靠 `tool_use_id` 和调用配对 |
| `image` | 粘贴的图是 `source.base64`，引用的是 `source.url` |

记录层面还有别的 `type`，比如会话被改过名字时的 `custom-title`。

### 结构化 diff {#structured-diffs}

文件编辑的 `tool_result` 回来时常常带一个 `structuredPatch` 字段：已经按 hunk 切好的 diff，而不是一坨文本。有这个字段，编辑才能渲染成真正的 diff。

## 在终端里读 Claude Code 会话

提取用户和助手的文本，不包含工具和图片：

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.claude/projects/-Users-me-apps-blog/<会话 id>.jsonl
```

统计调用过哪些工具，按次数排：

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

找出动过某个文件的会话：

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## 怎么恢复这个会话

在项目目录运行 `claude --resume SESSION_ID`，需要已安装 Claude Code。也可以使用应用的[终端或内置对话](/zh/features/resume)。继续对话可能调用配置的服务商，并追加新记录。

## 依据与限制

实现依据：[Claude Code 适配器](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/claude.rs)。上游：[Claude Code 文档](https://code.claude.com/docs/en/overview)。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->

找不到记录？按[排障清单](/zh/guide/troubleshooting)检查。

## 或者用应用打开

具体步骤和手动／GUI 取舍见 [Claude Code 搜索、导出与恢复流程](/zh/guide/claude-code-session-viewer)。

[Sessions Viewer](/zh/guide/) 直接读这些文件。已记录且受支持的思考块、配对工具、`structuredPatch` diff 和图片呈现为可读视图，历史浏览不重写原文件。选中 Claude Code 后，`⌘⇧F` 跨其项目搜索标题与用户提问；见[搜索与展示限制](/zh/features/read-and-search#search-scope)。它同时还读 [Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
