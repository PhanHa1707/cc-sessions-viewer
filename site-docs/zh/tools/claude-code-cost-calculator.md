---
title: Claude Code 成本计算器 — Token、缓存与月度估算
description: 免费在浏览器计算 Claude Code API 等价成本，分别输入普通输入、输出、缓存读取及 5 分钟/1 小时缓存写入，并查看模型价格与月度情景。
---

<script setup>
import CostCalculator from '../../.vitepress/theme/components/CostCalculator.vue'
import PricingTable from '../../.vitepress/theme/components/PricingTable.vue'
</script>

# Claude Code 成本计算器

输入记录的 Token，计算**以美元计价的 API 等价成本**。这个免费工具分别处理普通输入、输出、缓存读取和两种有效期的缓存写入，无需安装、账户或 API Key。

<noscript><p>启用 JavaScript 后可使用计算器；下方的公式与已核对价格不依赖交互。</p></noscript>

<CostCalculator locale="zh" />

## 从哪里获得 Claude Code Token 用量？ {#find-usage}

Claude Code 的 `/usage` 中 Session 区块会显示 Token 用量和成本估算；部分版本也提供 `/cost`，命令与字段取决于版本。请输入**每个模型的 Token 数**，不要把套餐百分比当作 Token。已有历史文件可用[本地 JSONL Token 计数器](/zh/tools/claude-code-token-counter)。

普通输入不包含缓存：Anthropic 的 `input_tokens` 与 `cache_read_input_tokens`、`cache_creation_input_tokens` 分开记录。缓存写入需拆分 5 分钟和 1 小时；如果来源只给总写入量，无法确定有效期，应核对后输入，不能把同一总量填到两项。

## 计算公式与公开样例 {#formula}

五种 Token 类别互不重叠，价格单位为美元 / 百万 Token（MTok）：

```text
成本 =（普通输入 × 输入价格
      + 输出 × 输出价格
      + 缓存读取 × 读取价格
      + 5 分钟写入 × 对应价格
      + 1 小时写入 × 对应价格）/ 1,000,000
工作月成本 = 成本 × 每日汇总次数 × 每月工作日
```

公开样例采用 Sonnet 5.5：普通输入 10,000（$0.02）、输出 5,000（$0.05）、缓存读取 300,000（$0.06）、5 分钟写入 10,000（$0.025）、1 小时写入为 0。**合计 $0.155**。每天重复 4 次、每月 22 个工作日，得到假设的**月度 $13.64**。输入一天总量时，每日汇总次数设为 1，不要再乘一天里的会话数。

中间计算不舍入，展示最多六位小数；正数低于 $0.000001 时标明小于该数，不展示为零。月度结果只是假设相同用量重复发生，不预测未来任务大小。

## 模型价格与缓存口径 {#rates}

**2026-10-06 核对**[Anthropic 官方定价](https://platform.claude.com/docs/en/about-claude/pricing)。下面是部分模型的标准全球 API 标价，不是全部模型，也不是实时价格接口。

<PricingTable locale="zh" />

缓存读取价格随模型变化：Opus 5.5 为 $0.20/MTok，Opus 4.8 为 $0.50/MTok，不能统一套用输入价的 0.1 倍。没有对应模型时选择**自定义价格**并自行核对全部五项，工具不会静默用其他模型兜底。

Fast mode、批处理折扣、地域/数据驻留加价、云供应商价格、协商折扣、税费和工具费用不在预设内。多个模型应分别计算后相加；相同 Token 数也不代表不同模型完成任务的质量或实际用量相同。

## 这是 Claude Pro / Max 的账单吗？ {#subscription}

不是。API 等价成本不等于订阅费、剩余额度、重置时间或剩余提示词次数。财务核对以供应商用量报告与账单为准。Claude Code 自己的估算可能采用组织配置的价格，按公开标价计算不一定与其显示一致。

参见[官方成本说明](https://code.claude.com/docs/en/costs)与[订阅额度区别](/zh/features/stats#subscription-quota)。

## 从单次估算到历史项目对比 {#desktop}

网页计算器处理本次输入的一份汇总。[Sessions Viewer 统计](/zh/features/stats)可按项目、模型、时间比较记录用量；[Claude Code 历史记录指南](/zh/guide/claude-code-session-viewer)介绍阅读、搜索与恢复。

[下载桌面应用](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)，或先用[浏览器本地 JSONL 计数器](/zh/tools/claude-code-token-counter)。参见[隐私说明](/zh/guide/privacy)。输入不会上传、写入网址或发送给模型。
