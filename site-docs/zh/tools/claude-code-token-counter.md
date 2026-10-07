---
title: Claude Code Token 计数器 — 本地统计 JSONL 记录用量
description: 在浏览器本地统计 Claude Code JSONL 的输入、输出和缓存 Token，合并重复消息 ID，显示缺失或错误用量，不上传会话文件。
---

<script setup>
import TokenCounter from '../../.vitepress/theme/components/TokenCounter.vue'
</script>

# Claude Code Token 计数器

在浏览器本地统计 Claude Code JSONL 的**记录用量**。选择文件或粘贴 JSONL；使用自己的数据前可以先试公开合成样例。这不是提示词文本分词器。

<noscript><p>启用 JavaScript 后可统计本地文件；下方仍可阅读支持格式与限制。</p></noscript>

<TokenCounter locale="zh" />

## 读取什么文件和字段？ {#format}

Claude Code 通常把项目会话保存在 `~/.claude/projects/`。选择一份会话 `.jsonl`；工具不能扫描目录或读取凭证。找不到文件时参见[存储位置说明](/zh/agents/claude-code)。

支持 `type: "assistant"` 且 `message.usage.input_tokens` 与 `output_tokens` 为非负整数的行，可选的 `cache_read_input_tokens`、`cache_creation_input_tokens` 也参与汇总。纯文本消息、用户提示词、`/usage` 原始文本、ccusage 导出和 Codex 文件不是本工具的输入格式。

```json
{"type":"assistant","message":{"id":"public-example","usage":{"input_tokens":100,"output_tokens":40,"cache_read_input_tokens":1000,"cache_creation_input_tokens":300}}}
```

这条记录含 **1,440 Token**：100 + 40 + 1,000 + 300。它是累计 API 用量，不是去重后的词数，也不是单次上下文窗口大小。

## 流式重复消息与缓存写入 {#dedup}

Claude 可能在一次流式响应中保存多行相同 `message.id`。计数器保留总量最大的完整用量快照；相同总量取最后一条。不会把每个快照相加，也不拼出各字段最大值。

没有 ID 的行单独计数并提示无法可靠去重。复制文件、复用 ID 或不完整快照都可能影响覆盖。网页工具不保证与桌面完整适配器、轮次边界或历史缓存修正完全一致。

如果同时记录旧版缓存创建总量与 `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`，取旧总量与拆分之和的较大值，绝不把两者重复相加。不一致会提示；未拆分总量不能证明缓存有效期或美元成本。

## 缺失或跳过的行代表什么？ {#coverage}

- 错误 JSON 或无效 Token 字段跳过，并在诊断中计数。
- 缺少 usage 对象的 assistant 行显示为用量缺失，不能当作测得的零成本。
- 缺少可选缓存字段在本次汇总中按 0 处理，不证明实际缓存用量为零。
- 没有可用记录时显示错误，不把零当作已测得的总量。
- 汇总会合并输入中的所有模型；按模型拆分请用桌面统计，不应把混合模型总量套用单一模型价格。
- 每次输入最多 **5 MiB、20,000 行**。较大或多文件统计使用较小片段或桌面应用；工具不会自动发现、合并文件。

公开样例有两条去重后的 assistant 消息、合并一条重复记录，总量 **1,710 Token**。解析使用合成输入独立测试，不包含真实 CLI 版本端到端验收或私人会话。审阅日期：2026-10-06。

## 能统计粘贴提示词的 Token 吗？ {#prompt-text}

不能。精确的模型输入分词与记录的计费用量不同；字符数、词数、工具定义、图片、隐藏上下文不能通过这个 JSONL 计数器换算成精确 Claude 用量。

它也不读取 Pro/Max 实时限制、不推断重置时间、不还原丢失记录。账户限制以供应商工具为准，参见[用量与额度区别](/zh/features/stats#subscription-quota)。

## 转换成本或跟踪历史 {#next}

将每个模型的用量与已核验的缓存有效期输入[Claude Code 成本计算器](/zh/tools/claude-code-cost-calculator)。不同模型的 Token 不应全部套用一个模型的价格。

[Sessions Viewer 统计](/zh/features/stats)可按项目、模型、时间分析；[Claude Code 历史流程](/zh/guide/claude-code-session-viewer)介绍阅读、搜索、导出、恢复。[下载免费桌面应用](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)。

输入只保留在浏览器内存，不上传、不写入 URL query 或 localStorage；重置或刷新即清除。站点仍会加载正常文档资源，分享或导出历史前请阅读[隐私说明](/zh/guide/privacy)。
