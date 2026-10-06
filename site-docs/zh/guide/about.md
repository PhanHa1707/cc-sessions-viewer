---
title: 关于 Sessions Viewer 与文档维护
description: Sessions Viewer 是通过公开GitHub仓库维护的MIT许可独立桌面项目，文档以源码与合成测试为依据，并明确实际CLI验证的边界。
---

# 关于 Sessions Viewer

Sessions Viewer 是用于本地 coding agent 历史与工具配置的独立 MIT 许可桌面应用，公开仓库为 [jerrywu001/cc-sessions-viewer](https://github.com/jerrywu001/cc-sessions-viewer)，不是 Anthropic、OpenAI 或其他 agent 厂商的官方产品。

## 项目与维护 {#maintenance}

- **项目名：**Sessions Viewer；仓库仍保留旧名称 `cc-sessions-viewer`。
- **正式文档：**[sessions-viewer.js-bridge.com](https://sessions-viewer.js-bridge.com)。
- **源码与许可：**[GitHub](https://github.com/jerrywu001/cc-sessions-viewer)及 [MIT 许可](https://github.com/jerrywu001/cc-sessions-viewer/blob/main/LICENSE)。
- **安装包与发布说明：**[Releases](https://github.com/jerrywu001/cc-sessions-viewer/releases)。文档和下载可能分别更新，请核对安装版本。
- **维护：**仓库 README 说明项目业余维护；此处不承诺响应时限或商业支持。

## 文档如何核查 {#documentation-evidence}

本轮于 2026-10-05 对照 0.6.0、源码版本 `22fefc6` 核对，agent 参考页链接到对应实现。命令回归在公开合成数据上执行文档中的 `jq`／SQL，不读取私人会话、不执行服务商请求或恢复命令。

[兼容矩阵](/zh/guide/compatibility)区分源码核对、命令测试与 CLI 运行验证。未端到端执行的 CLI 版本明确标为未验证。核对日期表示真实的文档复核，不是自动保证上游格式始终最新。

## 反馈问题或改进文档 {#feedback}

可通过 [GitHub issues](https://github.com/jerrywu001/cc-sessions-viewer/issues)反馈可复现缺陷与文档错误，或提交 PR。请附应用／CLI 版本、系统、操作与最小合成或脱敏记录；不要在公开 issue 贴 API key、未脱敏会话或私人数据库。

分享导出或配置截图前看[隐私与数据处理](/zh/guide/privacy)。具体使用可从 [Claude Code 会话](/zh/guide/claude-code-session-viewer)、[Codex 会话](/zh/guide/codex-session-viewer)或[工具管理](/zh/tools/)开始。
