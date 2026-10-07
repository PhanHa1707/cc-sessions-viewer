---
title: Claude Code コスト計算機 — トークン・キャッシュ・月額推定
description: Claude Code の API 相当コストをブラウザーで無料計算。入力・出力・キャッシュ読み込み、5 分と 1 時間の書き込みを分け、モデル料金と月間シナリオを確認。
---

<script setup>
import CostCalculator from '../../.vitepress/theme/components/CostCalculator.vue'
import PricingTable from '../../.vitepress/theme/components/PricingTable.vue'
</script>

# Claude Code コスト計算機

記録されたトークンから**USD の API 相当コスト**を推定します。通常入力、出力、キャッシュ読み込み、2 種類の書き込みを分ける無料ツールです。インストール、アカウント、API キーは不要です。

<noscript><p>計算機の利用には JavaScript を有効にしてください。下の計算式と確認済み料金はそのまま読めます。</p></noscript>

<CostCalculator locale="ja" />

## Claude Code の使用量はどこにある？ {#find-usage}

Claude Code の `/usage` の Session ブロックにはトークン数と推定コストがあります。一部のバージョンでは `/cost` も利用できますが、コマンドと項目はバージョン次第です。プランの割合ではなく、**モデルごとのトークン数**を入力してください。保存済み履歴には[ローカル JSONL カウンター](/ja/tools/claude-code-token-counter)を使えます。

通常入力にキャッシュを含めないでください。Anthropic の `input_tokens` は `cache_read_input_tokens` と `cache_creation_input_tokens` を除きます。書き込みは 5 分と 1 時間に分けます。合計しかない場合、有効期間は不明です。確認せず同じ合計を両方に入力しないでください。

## 計算式と公開サンプル {#formula}

5 区分は重複しません。料金は USD / 100 万トークン（MTok）です。

```text
コスト = (通常入力 × 入力料金
        + 出力 × 出力料金
        + キャッシュ読み込み × 読み込み料金
        + 5 分書き込み × 5 分料金
        + 1 時間書き込み × 1 時間料金) / 1,000,000
稼働月のコスト = コスト × 1 日の集計回数 × 月の稼働日
```

Sonnet 5.5 の公開サンプルは通常入力 10,000（$0.02）、出力 5,000（$0.05）、読み込み 300,000（$0.06）、5 分書き込み 10,000（$0.025）、1 時間書き込み 0。**合計 $0.155**。同じ集計を 1 日 4 回、月 22 日繰り返す仮定で **月 $13.64** です。1 日の総量を入力した場合、集計回数を 1 とし、セッション数を再度掛けないでください。

途中計算は丸めず、表示は小数点以下 6 桁までです。$0.000001 未満の正数はゼロではなく、その金額未満と表示します。月額は同じ使用量の反復で、将来のタスク規模を予測しません。

## モデル料金とキャッシュ {#rates}

**2026-10-06 に確認**した[Anthropic 公式料金](https://platform.claude.com/docs/en/about-claude/pricing)に基づきます。標準グローバル API の一部モデルの定価であり、全モデルやリアルタイム料金フィードではありません。

<PricingTable locale="ja" />

読み込みはモデル固有です。Opus 5.5 は $0.20/MTok、Opus 4.8 は $0.50/MTok で、一律 0.1 倍とは限りません。モデルがなければ**カスタム料金**を選び、5 区分すべてを自分で確認してください。別モデルの料金に黙って置き換えません。

Fast mode、バッチ割引、地域・データ所在地の加算、クラウド料金、契約割引、税、ツール料金はプリセットに含みません。複数モデルは別々に計算して合計します。同じトークン数でも同じタスク品質や実際の使用量を予測できません。

## Claude Pro / Max の請求額になる？ {#subscription}

なりません。API 相当コストは月額料金、残り上限、リセット時刻、残りプロンプト数ではありません。決済照合はプロバイダーの使用量レポートと請求書を使ってください。Claude Code 側が組織設定の料金を使う場合、定価計算と一致しないことがあります。

[公式コストガイド](https://code.claude.com/docs/en/costs)と[プラン上限との違い](/ja/features/stats#subscription-quota)を参照してください。

## 単発計算からプロジェクト履歴へ {#desktop}

この計算機は入力した 1 集計を評価します。[Sessions Viewer の統計](/ja/features/stats)ではプロジェクト、モデル、期間で記録使用量を比較できます。[Claude Code 履歴ガイド](/ja/guide/claude-code-session-viewer)は閲覧、検索、再開を説明します。

[デスクトップアプリをダウンロード](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)するか、[ブラウザーの JSONL カウンター](/ja/tools/claude-code-token-counter)を試してください。[プライバシー](/ja/guide/privacy)も参照してください。入力をアップロード、URL 保存、モデル送信しません。
