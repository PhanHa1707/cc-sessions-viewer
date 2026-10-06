---
title: 如何查看、查找与恢复 Codex rollout 会话
description: 根据session_meta中的cwd定位Codex项目，搜索用户与agent事件，避免重复response_item文本，导出解析后的历史并恢复原会话。
image: /screenshots/cover.png
---

# 找回并继续 Codex rollout

Sessions Viewer 读取本地 Codex rollout，按项目整理并帮助你先找回上下文再继续。它是独立开源应用，不是 OpenAI 官方产品。[安装](/zh/guide/install)后，不必新建对话就能浏览搜索。

## 1. 定位正确项目 {#find-project}

通常路径为 `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`。日期目录不是项目，项目路径保存在 **`session_meta.payload.cwd`**。同名仓库或自定义 Codex 根目录时尤其需要核对。

手动查看元数据：

```bash
jq -r 'select(.type=="session_meta") | .payload.cwd' rollout-SESSION.jsonl
```

文件名换成实际记录；也可下载<a href="/examples/codex.jsonl" download>合成 Codex 样例</a>，使用 `codex.jsonl`，预期 `/synthetic/project`。详细结构见 [Codex 参考](/zh/agents/codex)。此处核对的适配器扫描默认 `~/.codex` 路径，不会自动发现自定义 CLI 根目录。

### 要找已归档 rollout？ {#archived}

归档记录保存在 `~/.codex/archived_sessions/`，普通列表默认不包含；打开已归档会话视图查看。CLI 的归档状态与查看器回收站不同。先核对状态与保存路径，不要为了让它出现就移动文件或改数据库标记。

## 2. 找消息，再检查 rollout {#read}

选择项目的历史视图；全局搜索在 macOS 使用 `⌘⇧F`，跨项目搜一句独特文本，选择结果跳到匹配消息。会话内可用搜索或提问列表查看原任务，其他系统见[快捷键提示](/zh/features/shortcuts)。

![历史工作区中的项目与会话](/screenshots/cover.png)

Codex 的 `event_msg` 与 `response_item` 可能记录重叠正文，两者直接拼接会重复回答。参考页的手动文本筛选选择用户／agent 事件，不是工具、推理或所有旧格式的完整回放；需要时单独查看 response-item。

![将 JSONL 渲染为消息历史](/screenshots/chat.png)

## 3. 导出需要的内容 {#export}

会话导出可选 Markdown、离线 HTML 或解析后的消息 JSON。分享前脱敏代码、路径与工具结果。JSON 导出不是原生 rollout 备份，不能假定 Codex 可导入；归档应保留源文件。见[导出说明](/zh/features/export-and-trash)。

## 4. 恢复而不是重开 {#resume}

在预期项目目录运行：

```bash
codex resume SESSION_ID
```

使用保存的 ID，不是日期目录。查看器支持终端交接与 Codex 内置对话，都需要安装、配置 CLI 并具备有效认证。继续可能把内容发送给配置的服务商、写新历史和执行工具，先确认项目与权限模式。见[恢复选项](/zh/features/resume)及[隐私](/zh/guide/privacy)。

## CLI 检查还是图形界面 {#manual-vs-gui}

| 需求 | 手动路线 | 查看器路线 |
| --- | --- | --- |
| 确认 `cwd` 或 ID | 用 `jq` 读取 `session_meta.payload` | 选择按项目分组的历史 |
| 找忘记的指令 | 搜文件与事件类型 | 跨项目消息搜索 |
| 避免重复正文 | 选事件，单独查 response-item | 阅读解析后的对话 |
| 继续同一会话 | `codex resume SESSION_ID` | 内置／外部终端或内置对话 |

## 排障与限制 {#limits}

找不到项目可能是读取了不同根目录或系统用户；恢复失败可能是 ID 不存在、CLI 版本不同或认证不可用。修改原生文件前先用[排障清单](/zh/guide/troubleshooting)。

统计需要已记录用量事件；显示成本是估算，订阅额度是另一概念，见[用量与成本](/zh/features/stats)。

范围：2026-10-05 核对 0.6.0 适配器，[兼容矩阵与合成测试](/zh/guide/compatibility)不等于某个已安装 Codex CLI 版本的端到端认证。
