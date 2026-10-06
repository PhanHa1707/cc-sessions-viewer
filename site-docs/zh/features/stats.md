---
title: Coding agent Token 用量与估算成本统计
description: 区分 Claude Code、Codex 等 agent 的已记录用量、模型价格估算、opencode 记录成本、缺失字段和订阅额度，不把统计当成账单。
image: /screenshots/stats.png
---

# Token 用量与估算成本

Sessions Viewer 汇总的是**已记录用量**，不是服务商账单。按 `⌘⇧S` 打开统计，可对比项目、模型、工具和时间。缺少用量字段不代表免费：此处支持的 Antigravity CLI 格式没有 Token 字段。

![按项目和模型拆分的用量与成本统计](/screenshots/stats.png)

## 可以对比什么 {#usage-breakdown}

- 项目和模型：已记录 Token 与估算支出集中在哪里。
- 工具：调用了哪些工具、调用次数。
- 时间：今日、近 7 天、近 30 天。
- Agent：全部来源或单独一种。

覆盖范围取决于文件记录了什么、适配器识别什么。跨 agent 比较前先看[兼容范围与验证矩阵](/zh/guide/compatibility)。

## 价格来自哪里 {#price-source}

应用先从 [js-bridge 镜像](https://www.js-bridge.com/api/models)获取 models.dev 格式目录，失败时回退到 [models.dev](https://models.dev/api.json)，本地缓存 24 小时。这是获取价格目录的联网请求，不需要发送会话正文。

![应用中的模型价格表](/screenshots/model-price.png)

可以在价格表核查已知费率。部分计算路径遇到未知模型 ID 会采用回退估算；缺失的缓存费率和无法识别的服务商定价需谨慎看待。缺字段或价格不能证明用量或实际成本为零。

## 显示的成本就是账单吗 {#cost-vs-bill}

不是。目录估算不一定覆盖协议价、路由加价、折扣、订阅费、工具或其他收费，缓存与模型匹配也会影响结果。财务核对应以服务商实际用量报告和账单为准。

opencode 不同：查看器使用数据库中记录的成本，并计入子 agent 工作。记录成本仍不是独立核验后的账单，详见 [opencode 成本来源](/zh/agents/opencode#cost-from-db)。

支持的 Antigravity CLI 格式不贡献 Token 用量。其他 agent 也需要保存用量字段；只有正文的合成示例不能证明成本统计正确。

## 订阅额度与成本有什么不同 {#subscription-quota}

Claude、Codex 的订阅账户可能在输入框旁显示额度窗口，是否可用取决于账户、认证方式和服务商返回的窗口。API key 账户没有相同的订阅额度徽章。

剩余额度不等于按 Token 价格计算的支出。刷新额度可能访问已认证的服务商／CLI 服务，见[隐私与联网行为](/zh/guide/privacy)。

## macOS 菜单栏

菜单栏显示各 agent 的今日、7 天、30 天汇总，适用与统计页相同的用量覆盖及成本限制。

## 依据

2026-10-05 对照 Sessions Viewer 0.6.0 的[价格实现](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/stats/pricing.rs)与[统计适配器](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/stats)核对。这是实现说明，不是账单审计。
