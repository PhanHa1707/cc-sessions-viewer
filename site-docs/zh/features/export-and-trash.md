---
title: 导出与回收站
description: 导出 Markdown、HTML 或 JSON，说明 Pi 原生条目树信封与一般解析消息的区别、图片可迁移性，以及回收／还原的数据变更。
image: /screenshots/export.png
---

# 导出与回收站

`⌘E` 直接将当前会话导出为 Markdown（Windows/Linux 使用 `Ctrl+E`）；HTML 或 JSON 从会话的导出菜单选择。导出生成本地文件，不自动发布。删除是另一项操作，会把会话数据放进可还原的回收站；分享导出前先检查敏感信息。

## 导出

![导出为 HTML 文件的会话，在浏览器里打开](/screenshots/export.png)

导出菜单有三种格式；`⌘E` 是 Markdown 快捷键，不会打开格式选择器：

| 格式 | 用来做什么 |
| --- | --- |
| Markdown | 粘进 issue、PR 或文档 |
| HTML | 在浏览器中阅读，样式内联；图片能否迁移取决于来源 |
| JSON | 一般保存解析消息与元数据；Pi 使用下方原生条目树信封，都不是原文件逐字节备份 |

### Pi JSON 有什么不同 {#pi-json}

Pi 的 JSON 菜单与批量导出使用查看器专用的 `cc-session-viewer-pi-export` 信封，不是一般的解析消息信封。它包含 `header`、所有已记录分支中合法且带 ID 的原生 `entries`，以及 `selectedLeafId`。Markdown／HTML 则呈现选中的对话链路。

保存的是原生条目对象，不是原 JSONL 字节：无效 JSON 行及没有可识别条目 ID 的行会跳过。它不打包外部媒体，也没有证明 Pi CLI 可直接导入该 JSON 信封。完整归档仍需保留原记录与资源。于 2026-10-06 核对 [Pi 导出](https://github.com/jerrywu001/cc-sessions-viewer/blob/69e0b4f/src-tauri/src/agents/pi.rs)、[单条／批量分派](https://github.com/jerrywu001/cc-sessions-viewer/blob/69e0b4f/src/App.vue)及[文件写入](https://github.com/jerrywu001/cc-sessions-viewer/blob/69e0b4f/src/export.ts)，不是实际 CLI 往返验收。

### 所有图片都能离线阅读吗 {#offline-images}

HTML 内联样式与可读取的本地图片，可选浅色／深色主题。已内嵌的文字、样式和图片不需要服务器。但远程 `http(s)` 图片仍保留外链，打开时可能联网，不会自动下载；本地图片因文件缺失或权限不足而无法读取时，保留原路径，换一台机器可能失效。Markdown 和解析后的 JSON 也有相同的图片内联限制。

分享前检查导出文件，必要时保留源资源；不能默认所有图片可迁移，也不能保证外链不会过期。

批量导出对选中的会话做同样的事，之前导出过的记录留在一份历史列表里，方便找上周生成的那个文件。

## 回收站

![共享回收站，列着来自多个 agent 的已删除会话](/screenshots/trash.png)

文件型会话会移到回收站目录。opencode 则保存可还原快照，再从数据库移除选定会话的记录。这是主动数据变更，不是只读浏览。

`⌘⇧T` 打开回收站。里面每一项都标着来自哪个 agent、哪个项目、什么时候删的，还原会把它放回原位。如果目标位置已经存在同一个会话，还原会拒绝覆盖。

### 七种 agent 共用一个回收站

七种 agent 的会话形态各不相同：有的是单个文件，有的是整个目录，opencode 是 [SQLite 库](/zh/agents/opencode)里的一行。回收站用同一份列表处理所有这些，为每一项记下原路径、agent、项目和存储种类，才能正确还原。

这一点对目录型的 agent 最要紧。删一个 [Grok Build](/zh/agents/grok-build) 会话意味着移动整个文件夹，`updates.jsonl`、`summary.json`、锁文件一个不落，还原时也要把那个文件夹原样重建出来。

## 这里的只读指什么 {#the-read-only-guarantee}

阅读、搜索、导出、分析历史不会重写源记录，但导出文件、缓存和偏好可能写到本地。JSON 保存解析后的消息表示；完整备份仍应保留原生文件。

重命名、回收、还原、终端／对话继续、项目编辑和工具配置是不同的写入操作。清空回收站会永久删除保留数据。在线继续可能把提问和上下文发送给配置的服务商；更新、价格和额度检查也可能联网。

范围见[隐私与数据处理](/zh/guide/privacy)，继续会话见[恢复命令](/zh/agents/#resume-commands)。
