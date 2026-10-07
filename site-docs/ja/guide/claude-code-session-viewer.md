---
title: Claude Code 履歴ビューア — セッション検索・保存・再開
description: Sessions Viewer で Claude Code 履歴をプロジェクト別に検索し、ツール結果を読み、解析済み会話を保存して再開。ローカル使用量集計とコスト計算も試せます。
image: /screenshots/search.png
---

# Claude Code 履歴ビューア：検索・保存・再開 {#claude-code-の会話を探して続ける}

内容は覚えていても JSONL の場所が分からないとき、Sessions Viewer でローカル履歴をプロジェクト別に検索し、ツール結果を見て Claude Code に戻れます。[インストール](/ja/guide/install)してください。独立したオープンソースアプリで、Anthropic の公式製品ではありません。

## インストール前にローカル集計・コスト計算 {#browser-tools}

まず使用量を確認するには：

[Claude Code コスト計算機](/ja/tools/claude-code-cost-calculator) · [Claude Code トークンカウンター](/ja/tools/claude-code-token-counter)

## 1. プロジェクトと入力を探す {#find}

1. アプリを開き、プロジェクトの履歴ビューを選びます。
2. 記憶にある特徴的な文をグローバル検索します。macOS は `⌘⇧F` です。結果を選ぶと会話の該当メッセージへ移動します。
3. 会話が分かっていれば入力一覧かビュー内検索 `⌘F` を使います。ほかの OS は[ショートカットの表示](/ja/features/shortcuts)を参照してください。

![プロジェクトを横断する履歴検索](/screenshots/search.png)

通常の保存先は `~/.claude/projects/<encoded-project>/<uuid>.jsonl` です。メッセージとツールの形式は[保存形式のリファレンス](/ja/agents/claude-code)にあります。見つからない場合はフォルダ名だけでなく、設定した保存先と[確認リスト](/ja/guide/troubleshooting)を確認します。

## 2. 続行前に文脈を確認する {#read}

入力、回答、対応するツール呼び出し／結果を読み、必要なときだけ思考を展開します。結果に `structuredPatch` があれば差分表示が可能です。画像やツールは元の記録に依存し、単純なテキスト抽出では再現できません。

![ツール結果と構造化変更の履歴表示](/screenshots/chat.png)

閲覧と検索は元の記録を書き換えません。リネーム、ゴミ箱／復元、編集、チャット続行は別の操作です。[データの扱い](/ja/guide/privacy)を参照してください。

## 3. 内容を保存する {#export}

エクスポートではメモ向けの Markdown、オフライン HTML、解析済みメッセージ JSON を選べます。共有前に入力、コード、パス、ツール出力の機密情報を確認します。Claude JSONL のバイト単位バックアップではないため、完全な保存には原本を残してください。[保存オプション](/ja/features/export-and-trash)を参照できます。

## 4. 同じ作業を再開する {#resume}

プロジェクトのディレクトリからネイティブ CLI を使います。

```bash
claude --resume SESSION_ID
```

実際の保存 ID に置き換えます。内蔵／外部ターミナルへの引き継ぎと Claude Code の内蔵チャットに対応します。CLI のインストール、設定、認証が必要で、プロバイダの契約を代替しません。続行は通信、履歴の書き込み、ツール実行を伴い得ます。先にプロジェクトと権限設定を確認してください。[再開の動作](/ja/features/resume)を参照できます。

## JSONL を手動で見るか、ビューアを使うか {#manual-vs-gui}

| 用途 | 手動確認 | Sessions Viewer |
| --- | --- | --- |
| 1 フィールドの確認 | `jq` で直接確認 | メッセージの文脈も表示 |
| 過去の入力を横断検索 | ファイル探索とフィルター | グローバル検索と入力移動 |
| ツールとパッチの確認 | ID で自分で関連づける | 対応する結果・差分を表示 |
| 続行 | 保存 ID で `claude --resume` | ターミナルまたは内蔵チャット |

安全な練習には[合成 Claude サンプルと期待出力](/ja/guide/compatibility#synthetic-samples)を使い、[リファレンス](/ja/agents/claude-code)の `jq` を実行します。実際に再開できる会話ではありません。

## うまくいかない場合 {#limits}

- **履歴がない：**保存先、ユーザー、CLI が記録を保存したかを確認。
- **画像／ツール／差分がない：**元のフィールドを確認。すべての形式が同じデータを持つわけではありません。
- **再開できない：**ID、作業ディレクトリ、CLI 認証、ターミナル設定を確認。
- **コストが違う：**記録と料金表は推定で、請求書ではありません。[統計](/ja/features/stats)を確認。

2026-10-05 に 0.6.0 の実装を照合しました。今回、特定の Claude Code CLI 版の実行テストは行っていません。[検証表](/ja/guide/compatibility)を参照してください。
