---
title: 如何查找、阅读、导出与恢复 Claude Code 会话
description: 用 Sessions Viewer 按项目搜索 Claude Code 历史提问、核对工具结果与差异，导出解析后的消息，再通过CLI或内置对话继续原任务。
image: /screenshots/search.png
---

# 找回并继续 Claude Code 会话

记得对话内容却不知道是哪份 JSONL 时，可以用 Sessions Viewer 按项目浏览本地历史、搜索消息、查看工具结果，再交回 Claude Code 继续。[下载安装](/zh/guide/install)后即可浏览。这是独立开源应用，不是 Anthropic 官方产品。

## 1. 找项目和原始提问 {#find}

1. 打开应用，选择项目的历史视图。
2. 在全局搜索中输入记得的一句独特文本；macOS 快捷键为 `⌘⇧F`，点击结果即可打开会话并跳到消息。
3. 已知道会话时，用提问列表或视图内搜索 `⌘F` 找到具体位置。其他平台请看[快捷键提示](/zh/features/shortcuts)。

![全局搜索跨本地项目找到匹配消息](/screenshots/search.png)

Claude Code 通常保存在 `~/.claude/projects/<encoded-project>/<uuid>.jsonl`。路径、消息块和工具结果结构见[存储参考](/zh/agents/claude-code)。找不到项目时，应检查应用数据根目录与[排障清单](/zh/guide/troubleshooting)，不只猜编码文件夹名。

## 2. 先阅读，再继续 {#read}

核对用户提问、回答以及配对的工具调用／结果；需要时展开思考。结果带有 `structuredPatch` 时可渲染差异，不必阅读转义 JSON。图片与工具依赖原记录内容，纯文本提取不等于完整回放。

![配对工具结果及结构化变更的历史回放](/screenshots/chat.png)

阅读、搜索不会重写原记录；重命名、回收／还原、项目编辑和继续对话属于不同操作，见[数据处理](/zh/guide/privacy)。

## 3. 导出内容，不把它当原生备份 {#export}

用会话导出：Markdown 适合笔记，HTML 适合离线页面，JSON 保存解析后的消息。分享前检查提问、代码、路径和工具输出是否含隐私。导出不是 Claude JSONL 的逐字节备份，完整归档应保留源文件。见[导出选项](/zh/features/export-and-trash)。

## 4. 恢复原任务 {#resume}

在项目目录中运行原生 CLI：

```bash
claude --resume SESSION_ID
```

将 `SESSION_ID` 换成真实保存的 ID。查看器支持内置或所选外部终端启动，也支持 Claude Code 内置对话。先安装、配置并认证 CLI，应用不替代服务商账户。继续可能联网、写历史和执行工具，发送前确认项目与权限模式。见[恢复行为](/zh/features/resume)。

## 手动 JSONL 还是查看器 {#manual-vs-gui}

| 任务 | 手动检查 | Sessions Viewer |
| --- | --- | --- |
| 确认一个字段 | `jq` 直接透明 | 同时看消息上下文 |
| 跨项目找旧提问 | 找文件、写筛选 | 全局搜索与提问导航 |
| 阅读工具、结果与补丁 | 自己按 ID 配对 | 配对工具结果、支持的差异渲染 |
| 继续任务 | 用保存的 ID 执行 `claude --resume` | 终端交接或内置对话 |

安全练习可下载[合成 Claude 样例及预期输出](/zh/guide/compatibility#synthetic-samples)，配合[参考页](/zh/agents/claude-code)的 `jq` 筛选。这些不是可恢复的真实会话。

## 不生效时检查什么 {#limits}

- **没有会话：**检查根目录、系统用户以及 CLI 是否保存过记录。
- **图片／工具／差异缺失：**检查原始结构，不同记录不一定包含相同字段。
- **恢复失败：**检查 ID、项目目录、CLI 安装认证与终端设置。
- **成本有误：**记录用量与目录价格属于估算，不是账单，见[统计](/zh/features/stats)。

范围：2026-10-05 核对 0.6.0 实现，本轮未对特定 Claude Code CLI 版本做端到端运行测试，见[验证矩阵](/zh/guide/compatibility)。
