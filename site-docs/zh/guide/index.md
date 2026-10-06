---
title: Sessions Viewer 是什么
description: Sessions Viewer 把 Claude Code、Codex 等七种 coding agent 的本地会话记录变成一个可搜索的工作区，能阅读、恢复、导出并统计每个会话的花费。
---

# Sessions Viewer 是什么

Sessions Viewer 读取 coding agent CLI 留在你磁盘上的会话记录，把它们摆进同一个工作区。打开一个项目，看清某个会话里到底发生了什么，然后从同一个位置接着干。你不需要再手动翻 JSONL 文件。

> [!TIP]
> **工具管理**是应用最新加入的部分：七种 agent 的 skills、MCP 服务器、hooks 和指令文件集中在一处。把本机重复的 skill 和断掉的链接找出来并修好，查看缓存的 MCP 上下文估算并预览文件改动。测试 hook 前先检查命令，dry-run 会实际执行脚本，不是沙箱。[查看工具管理文档](/zh/tools/)。

## 快速找答案

- [会话记录在哪，怎么恢复？](/zh/agents/)
- [找不到会话怎么办？](/zh/guide/troubleshooting)
- [哪些功能本地运行，哪些可能联网？](/zh/guide/privacy)
- [怎么安装？](/zh/guide/install)
- [如何找回并继续 Claude Code 历史？](/zh/guide/claude-code-session-viewer)
- [如何定位与恢复 Codex rollout？](/zh/guide/codex-session-viewer)
- [哪些格式和版本有验证依据？下载样例。](/zh/guide/compatibility)
- [如何复用 skill 或检查 MCP 配置？](/zh/tools/share-skills)
- [项目与文档怎样维护？](/zh/guide/about)

## 阅读与定位

[阅读视图](/zh/features/read-and-search)按当时发生的样子回放一个会话。思考链挂在它所属的消息上，每次工具调用挨着它的结果，文件编辑渲染成结构化 diff，粘贴的截图内联显示。

全局搜索（`⌘⇧F`）跨所有项目运行，直接跳到命中的那条消息。在一个长会话里，提问列表只列你自己敲过的话，选一条就滚到那儿，并闪一下标出位置。最近打开过的阅读和对话视图按项目留在一份历史里，可搜索、可收藏。

## 继续工作

Claude Code 和 Codex 的会话可以在[内置对话](/zh/features/resume)里继续，模型、推理强度（含 Opus Ultracode）和权限模式都是实时可调的开关。任何会话都可以一键在内嵌终端里恢复，或者交给 Terminal.app、cmux、iTerm2、Ghostty、Warp。

Shell 标签在 agent 会话旁边跑普通命令。重启后可恢复标题／目录等元数据，但会启动新 Shell，不恢复原来运行的命令。像 `--dangerously-skip-permissions` 这样的启动参数按 agent 分别配置，新建和恢复会话时自动带上。

## 管理项目

把窗口切成[左右并排或上下堆叠的分屏](/zh/features/panes)，在分屏之间拖动标签，每个项目的布局跨重启保留。用 cmux 的话，应用会按工作目录复用 workspace、找到正在运行的会话、选好拆分方向，并按目录名给标签命名。

书签把常用文件夹钉到侧栏，按 agent 各自管理。重命名会话会把新名字同步回 CLI，删除会话是移进一个可以还原的回收站。

## 统计与导出

[统计视图](/zh/features/stats)按项目、模型或工具汇总已记录用量与估算成本，采用缓存的 models.dev 价格，不是服务商账单。支持的 Antigravity 记录没有用量字段；macOS 菜单栏显示有用量字段的今日 / 7 天 / 30 天汇总。

单个或一批会话可以[导出](/zh/features/export-and-trash)成 Markdown、HTML 或解析后的消息 JSON。文字与已内嵌资源可本地阅读；远程或无法读取的本地图片不保证离线可用。导出只读源记录；重命名、回收、还原和继续会话有不同的写入行为，见[隐私与数据处理](/zh/guide/privacy)。

## 支持的 agent

Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI 和 opencode。应用内对话只对 Claude Code 和 Codex 开放，七种都有历史、搜索、导出和终端恢复，用量覆盖因格式而异。[Agents 参考](/zh/agents/)讲了每一种把会话存在磁盘的什么地方。
