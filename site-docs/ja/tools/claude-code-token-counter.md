---
title: Claude Code トークンカウンター — JSONL 記録使用量をローカル集計
description: Claude Code JSONL の入力・出力・キャッシュトークンをブラウザーで集計。メッセージ ID の重複、欠落・不正な使用量を確認し、履歴をアップロードしません。
---

<script setup>
import TokenCounter from '../../.vitepress/theme/components/TokenCounter.vue'
</script>

# Claude Code トークンカウンター

Claude Code JSONL の**記録使用量**をブラウザー内で集計します。ファイルを選ぶか JSONL を貼り付けます。自分のデータの前に公開合成サンプルを試せます。プロンプト文字列のトークナイザーではありません。

<noscript><p>ローカル集計には JavaScript を有効にしてください。対応形式と制限は下で読めます。</p></noscript>

<TokenCounter locale="ja" />

## 対象ファイルと項目 {#format}

通常は `~/.claude/projects/` に会話を保存します。セッションの `.jsonl` を選んでください。ツールはフォルダーの走査や認証情報の読み取りをしません。[保存場所](/ja/agents/claude-code)を参照してください。

`type: "assistant"` で、`message.usage.input_tokens` と `output_tokens` が非負整数の行が対象です。任意の `cache_read_input_tokens` と `cache_creation_input_tokens` も含めます。テキストだけのメッセージ、ユーザープロンプト、`/usage` テキスト、ccusage エクスポート、Codex ファイルは対応形式ではありません。

```json
{"type":"assistant","message":{"id":"public-example","usage":{"input_tokens":100,"output_tokens":40,"cache_read_input_tokens":1000,"cache_creation_input_tokens":300}}}
```

この行は **1,440 トークン**（100 + 40 + 1,000 + 300）です。累積 API 使用量であり、重複を除いた単語数やコンテキストウィンドウの大きさではありません。

## ストリーミング重複とキャッシュ {#dedup}

1 回の応答で同じ `message.id` の assistant 行が複数保存される場合があります。合計が最大の使用量スナップショットを丸ごと採用し、同点なら最後を使います。各スナップショットを足したり、項目ごとの最大値を合成したりしません。

ID のない行は別々に集計して注意を表示します。複製、ID の再利用、不完全な記録は対象範囲に影響します。デスクトップの完全なアダプター、ターン境界や過去のキャッシュ補正と一致する保証はありません。

旧キャッシュ作成合計と `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens` が併記される場合、旧合計と内訳の合計の大きい方を使い、両方を足しません。不一致を表示します。内訳のない合計から有効期間や金額は確定できません。

## スキップ・欠落の意味 {#coverage}

- 不正 JSON と無効なトークン項目をスキップし、診断で数えます。
- usage のない assistant 行は欠落であり、測定したゼロコストではありません。
- 任意のキャッシュ項目がなければ 0 として集計しますが、実際のキャッシュ使用量がゼロだった証拠ではありません。
- 有効な記録がない場合、ゼロを測定値として示さずエラーを表示します。
- 入力内の全モデルを合計します。モデル別の集計はデスクトップ統計を使い、混在した総量を 1 モデルの料金に当てはめないでください。
- 1 入力は **5 MiB、20,000 行**までです。大きい・複数のファイルは小さい抜粋やデスクトップアプリを使ってください。ファイルを自動発見・統合しません。

公開サンプルは 2 件の assistant 使用量、1 件の重複統合、**1,710 トークン**です。合成入力で独立テストし、実 CLI バージョンの E2E 検証や私的履歴は含みません。確認日：2026-10-06。

## 貼り付けたプロンプトを数えられる？ {#prompt-text}

このツールではできません。モデル入力の正確な分割は保存された課金使用量とは異なります。文字数、単語数、ツール定義、画像、隠れた文脈を JSONL カウンターで正確な Claude 使用量に変換できません。

Pro/Max のリアルタイム上限、リセット時刻や欠落記録の復元にも対応しません。アカウント上限はプロバイダーのツールを使い、[使用量と上限の違い](/ja/features/stats#subscription-quota)を参照してください。

## コスト計算と履歴追跡 {#next}

モデルごとの使用量と確認済みキャッシュ有効期間を[Claude Code コスト計算機](/ja/tools/claude-code-cost-calculator)に入力してください。違うモデルのトークンをすべて同じ料金で計算しないでください。

[Sessions Viewer 統計](/ja/features/stats)はプロジェクト、モデル、期間ごとの分析を提供します。[Claude Code 履歴ワークフロー](/ja/guide/claude-code-session-viewer)は閲覧、検索、書き出し、再開を説明します。[無料アプリをダウンロード](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)。

入力はブラウザーメモリーだけにあり、アップロード、URL query 保存、localStorage 保存をしません。リセットや再読み込みで消えます。サイト資産の通常の読み込みは発生します。履歴を共有・書き出す前に[プライバシー](/ja/guide/privacy)を確認してください。
