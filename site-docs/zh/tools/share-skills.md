---
title: 跨 agent 复用 skill 并修复失效链接
description: 在Sessions Viewer中检查重复技能、选择共用来源、预览移动和链接修复，避免误删项目变体或把文件共用误认为所有agent行为一致。
image: /screenshots/tools-skills-repair.png
---

# 共用一份 skill，避免多份副本越改越不同

适用于 Claude Code、Codex 等目录有同一个 skill，或源目录移动后技能消失的情况。工具管理清点文件与引用，不会把 skill 自动翻译成每个 agent 的等价行为。

## 1. 修改前先检查 {#inspect}

从侧栏扳手或 macOS `⌘K` 打开工具管理，选择 Skills。筛选重复、绕路或死链并打开该项，核对 **Content**、**References**、**Enabled in**，不只看显示名。

![带重复与死链筛选的技能清单](/screenshots/tools-skills.png)

| 发现 | 先确认什么 |
| --- | --- |
| 重复 | 内容相同，还是项目故意使用不同版本？ |
| 绕路 | 最终目标存在吗，将绕过哪一个中间链接？ |
| 死链 | 内容在别处，还是已经真的被删除？ |

风险徽章只是提示值得检查的模式，不是安全认证。安装或运行陌生 skill 前阅读脚本与依赖。

## 2. 选择保留的内容 {#choose-source}

先比较副本。项目专用变体可能需要独立保留。选择 **Move to main store** 时逐项核对来源、目的地、移动与链接步骤，解决冲突后才确认。这会修改文件与链接，重要自定义内容应另留备份。

![应用前预览移动与创建链接](/screenshots/tools-skills-adopt.png)

只启用计划使用的 agent。共用文件不代表各 agent 在相同作用域加载，或完全按同样方式执行。

## 3. 修复引用，不是找回被删内容 {#repair}

打开修复预览核对最终路径；绕路修复可直接指向正文目录。如果正文已不存在，修复可能清理死引用，但不能重新生成被删技能。不符合预期就取消。

![将绕路引用改为直接指向正文的预览](/screenshots/tools-skills-repair.png)

删除不是归并：删除技能可能移除引用和副本。确认前阅读完整范围，详见[技能管理总览](/zh/tools/#skills)。

## 4. 在目标 agent 验证 {#verify}

按该 agent 的加载方式刷新或重开，再检查能否发现技能。仍缺失时检查项目／全局作用域、根目录及当前系统的符号链接支持。真实加载由目标 agent 决定，这里不暗示已认证某个 CLI 版本。

找新技能见[发现流程](/zh/tools/#discover)。安装可能启动外部命令、访问注册源；hooks 能执行真实脚本，都不是沙箱。分享路径与配置前看[数据处理](/zh/guide/privacy)。

依据：2026-10-05 核对 0.6.0 的[技能写入](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/tools/skills_write.rs)与[链接处理](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/tools/link.rs)。另见[验证范围](/zh/guide/compatibility)及 [MCP 配置检查](/zh/tools/check-mcp)。
