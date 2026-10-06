---
title: Codex 的会话记录存在哪
description: Codex 把会话写成 ~/.codex/sessions/ 下按日期分桶的 rollout-*.jsonl，项目路径记在文件内部。目录结构、两种记录类型，以及用 jq 读会话的命令。
---

# Codex 的会话记录存在哪

Codex 一个会话一个 JSONL 文件，按会话开始的日期归档：

```
~/.codex/sessions/<YYYY>/<MM>/<DD>/rollout-<时间戳>-<uuid>.jsonl
```

真实的一个长这样：

```
~/.codex/sessions/2026/03/20/rollout-2026-03-20T09-55-16-019d08f4-37fe-7090-96a6-100d7fbe09df.jsonl
```

归档过的会话会挪到隔壁目录：

```
~/.codex/archived_sessions/
```

Codex 还在 `~/.codex/state_<N>.sqlite` 维护一个带 schema 版本号的状态库，`<N>` 随 schema 变更递增，编号最大的那个才是当前在用的。

## 路径不告诉你项目是哪个

目录层级是日期，不是项目。工作目录记在文件的 `session_meta.payload.cwd` 字段里。所以「把这个仓库的所有 Codex 会话列给我」这个需求，光看目录列表答不出来，必须逐个打开文件把 `cwd` 读出来。

## 两种记录

Codex 的 JSONL 更像事件流而不是消息日志，同一轮对话会以两种抽象层次各写一遍：

| 记录 | 是什么 |
| --- | --- |
| `event_msg` | 高层对话事件。文本干净，已经整理过 |
| `response_item` | 模型 API 的原始 item：工具调用、多段 content 数组 |

要可读文本就用 `event_msg`，要工具调用细节或者附件就看 `response_item`。

### 图片被拆成两条

一轮里粘了图的用户输入会被写成两条记录。`role: user` 的 `response_item` 带着 `input_image` 块和真正的图片数据，`event_msg.user_message` 带着干净的文本。两条各自都不完整。想还原成当时那个气泡，必须把图缓存住再贴到对应的文本事件上。

## 在终端里读 Codex 会话

打印对话文本：

```bash
jq -r 'select(.type=="event_msg")
  | .payload // . | select(.type=="user_message" or .type=="agent_message")
  | .message // .text' \
  ~/.codex/sessions/2026/03/20/rollout-*.jsonl
```

不开编辑器就看出一个会话属于哪个项目：

```bash
jq -r 'select(.type=="session_meta") | .payload.cwd // empty' SESSION.jsonl | head -1
```

按项目归类所有会话。目录结构不肯给你这份列表，所以循环必须打开每一个文件：

```bash
for f in ~/.codex/sessions/*/*/*/rollout-*.jsonl; do
  jq -r 'select(.type=="session_meta") | .payload.cwd // empty' "$f" 2>/dev/null | head -1
done | sort | uniq -c | sort -rn
```

## 怎么恢复这个会话

在项目目录运行 `codex resume SESSION_ID`，需要已安装 Codex；也可以用应用的[终端或内置对话](/zh/features/resume)。普通列表默认不包含已归档记录，请打开应用的已归档会话视图查找。

## 依据与限制

实现依据：[Codex 适配器](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/codex.rs)。上游：[Codex 文档](https://developers.openai.com/codex/)。

<!--@include: ../../.vitepress/snippets/reference-zh.md-->

查看器读取上述 home 目录布局；CLI 用其他 `CODEX_HOME` 写入的记录不会自动覆盖。见[找不到会话的排障指南](/zh/guide/troubleshooting)。

## 或者用应用打开

具体步骤和手动／GUI 取舍见 [Codex 项目定位、归档、导出与恢复流程](/zh/guide/codex-session-viewer)。

[Sessions Viewer](/zh/guide/) 替你归类和缓存，将拆开的图片记录重新配对；认证账户返回订阅额度窗口时，也可以显示它。额度不等于 Token 成本账单，见[统计](/zh/features/stats)。它同时还读 [Claude Code](/zh/agents/claude-code)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
