---
title: 检查 MCP 被哪些 agent 加载及配置来源
description: 在Sessions Viewer中核对MCP配置文件、兼容读取、缓存上下文估算与编辑预览，区分存在配置和服务器实际可连接、可认证、可运行。
image: /screenshots/tools-mcp.png
---

# 修改前核对 MCP 配置

配置文件里有 MCP 条目，不等于服务器可达、认证成功或工具可用。先用 Sessions Viewer 看哪些 agent 读取它、预览改动，再在目标 agent 中验证实际连接。

## 1. 明确配置来源 {#provenance}

打开工具管理的 MCP servers，选择条目，检查 **Active in**、路径、命令／URL 与归属。兼容读取很重要：Grok 可能读取 Claude 配置，修改共用条目可能影响两者。

![带 agent 来源和上下文估算的 MCP 清单](/screenshots/tools-mcp.png)

删除或复制前区分直接配置与兼容继承。JSON 和 TOML 语法不同，通过预览看目标格式，不直接把同一块粘到所有文件。

## 2. 正确理解上下文估算 {#context-estimate}

估算读取 Pi、Antigravity 的本地工具定义缓存，不为测量而启动服务器。按 **4 字符约 1 Token** 计算，不是所选模型 tokenizer 的精确结果。没有缓存是未测量，不是零工具或不占上下文。

它估计工具定义开销，不包含服务器响应、后续调用或精确账单用量。同名服务器可能共用缓存查找，预算决策前核对实际身份。

## 3. 一次预览一个明确改动 {#preview}

对预期 agent 执行启用／禁用、编辑、复制或删除，确认前核对：

- 目标文件、agent 范围以及兼容读取方。
- 修改前后值及无关条目是否保留。
- 命令、可执行路径、环境变量引用与 URL。
- 备份与冲突提示；文件在检查后发生变化，应刷新重审，不强制覆盖。

列表可能掩码密钥，但揭示后的详情／预览仍可能显示它们。截图和分享包都应先检查，不把真实 key 放进公开示例。

## 4. 单独验证真实运行 {#runtime-check}

按目标 agent 的要求重新加载，检查启动、认证与工具列表。保存配置不能证明网络、依赖命令、协议或权限可用。

失败时记录应用／agent 版本与脱敏配置结构，检查可执行程序、项目／全局作用域、环境与服务访问；不要公开 token 或完整私人配置。配置分享包用于选择性分享设置，不代替含密钥的完整备份。

界面功能见 [MCP 管理](/zh/tools/#mcp)，技能见[复用与链接修复](/zh/tools/share-skills)。Hooks 是另一类：所谓 dry-run 仍会执行配置的命令，不是安全沙箱。

依据：2026-10-05 核对 0.6.0 的 [MCP 检查与缓存估算](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/tools/mcp.rs)及[配置写入](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/tools/mcp_write.rs)。本指南没有真实连接 MCP 或验证特定 CLI 版本，见[隐私](/zh/guide/privacy)。
