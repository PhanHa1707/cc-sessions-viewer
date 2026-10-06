---
title: Sessions Viewer 隐私与数据处理：本地历史、在线对话与文件写入
description: 说明历史浏览时哪些数据留在本地，在线对话与集成何时联网，以及哪些主动操作会修改会话文件、配置或数据库。
---

# Sessions Viewer 是完全离线的吗

**历史解析、搜索和导出在本地运行，但整个应用并非完全不联网。** 继续会话会调用配置的 CLI／服务商，更新检查、模型价格与订阅额度也可能产生网络请求。处理机密会话时，需要区分这些功能。

## 哪些操作读取，哪些会写入

| 操作 | 数据处理 |
| --- | --- |
| 浏览、搜索、计算本地记录统计 | 读取会话文件或只读查询 opencode 库；可能写本地缓存与设置 |
| 导出 | 写本地导出文件，不等于自动发布 |
| 重命名 | 更新 agent 的标题数据；部分 agent 会追加标题记录或修改数据库 |
| 回收／还原 | 移动文件、目录或变更 opencode 数据库记录；永久清理回收站会删除保留副本 |
| 终端恢复／内置对话继续 | 启动 CLI，可能追加会话、调用服务商、执行获准的工具 |
| 项目文件编辑／工具管理 | 主动修改项目文件、skills、MCP、hooks 或指令配置 |

“历史浏览只读”不等于所有功能只读。破坏性操作前备份重要数据，操作见[导出与回收站](/zh/features/export-and-trash)。

## 哪些功能可能联网

- **对话与 CLI 恢复：**提示词、上下文、附件可能发送给配置的服务商。本地模型也有自己的行为，内置对话本身不代表离线。
- **版本检查与更新：**访问 GitHub release／更新地址，后台版本检查可能在启动时执行。
- **模型价格：**从 js-bridge 的 models.dev 镜像获取价格目录，失败时回退到 models.dev。该请求取目录，本地成本计算不需要发送会话正文。
- **订阅额度：**Claude／Codex 的额度功能会使用账户凭据或 CLI 的登录状态请求额度信息，与读取本地历史是不同功能。
- **MCP、hooks、shell 命令与外部链接／图片：**取决于工具配置及引用服务，应另行核查权限和隐私政策。

远端服务会收到 IP 地址等普通请求信息。历史本地浏览不是“应用、CLI 或集成永远不联网”的保证。

## 分享导出或报告问题前

检查提问、工具输出、截图、绝对路径和附件是否包含秘密或个人信息。导出 JSON 是查看器解析后的消息数据，**不是每个 agent 原始文件的逐字节完整备份**。需要完整备份时请保留原始文件。

报告问题优先用保留结构的最小合成样本。不要直接附整个会话、数据库、`auth.json`、API key、账户 token 或未脱敏诊断日志，只分享复现所需字段。

## 实现依据

2026-10-05 对照 Sessions Viewer 0.6.0 源码核对。这是实现说明，不是独立安全审计：

- [会话读取及显式数据操作](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents)
- [本地导出实现](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src/export.ts)
- [对话进程集成](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agent_chat.rs)
- [后台更新检查](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src/updateCheck.ts)
- [价格目录请求](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/stats/pricing.rs)
- [Claude 额度请求](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/usage_api.rs)／[Codex 额度集成](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/codex_usage.rs)

更多见[入门指南](/zh/guide/)、[会话格式对比](/zh/agents/)或[安装说明](/zh/guide/install)。
