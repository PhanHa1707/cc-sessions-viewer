---
title: Codex rollout の履歴を探して閲覧・再開する方法
description: session_metaのcwdでCodexプロジェクトを特定し、ユーザーとagentのイベントを検索、重複した本文を避けて保存し、元の会話を再開します。
image: /screenshots/cover.png
---

# Codex rollout を探して続ける

Sessions Viewer はローカルの Codex rollout を読み、プロジェクト別に整理して続行前の文脈を確認できます。独立したオープンソースアプリで、OpenAI の公式製品ではありません。[インストール](/ja/guide/install)後、新しい会話を作らずに閲覧・検索できます。

## 1. 正しいプロジェクトを特定する {#find-project}

通常は `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` に保存します。日付フォルダはプロジェクトではなく、作業パスは **`session_meta.payload.cwd`** です。同じ名前のリポジトリや別の保存先を使った場合に確認してください。

メタデータの手動確認：

```bash
jq -r 'select(.type=="session_meta") | .payload.cwd' rollout-SESSION.jsonl
```

実際のファイル名に置き換えます。<a href="/examples/codex.jsonl" download>合成 Codex サンプル</a>なら `codex.jsonl` を使い、結果は `/synthetic/project` です。[Codex リファレンス](/ja/agents/codex)に詳細があります。確認した実装は既定の `~/.codex` を走査し、CLI の独自保存先を自動検出しません。

### アーカイブ済みの rollout を探すには {#archived}

`~/.codex/archived_sessions/` に保存され、通常の一覧には含まれません。アーカイブ表示を開いて確認します。CLI のアーカイブとビューアのゴミ箱は別です。状態と保存パスを先に確認し、表示させるためだけにファイル移動や DB のフラグ変更をしないでください。

## 2. メッセージと rollout を読む {#read}

プロジェクトの履歴を選び、グローバル検索で特徴的な文を探します。macOS は `⌘⇧F` です。結果から該当メッセージへ移動し、会話内検索や入力一覧で元の指示を確認できます。ほかの OS は[ショートカット](/ja/features/shortcuts)を参照してください。

![履歴ワークスペースのプロジェクトとセッション](/screenshots/cover.png)

`event_msg` と `response_item` は同じ本文を記録する場合があり、両方をそのまま連結すると回答が重複します。リファレンスの手動抽出はユーザー／agent のイベントを選びます。ツール、推論、すべての旧形式の完全な再現ではなく、必要なら response-item を別に確認します。

![JSONL をメッセージとして表示](/screenshots/chat.png)

## 3. 必要な内容を保存する {#export}

Markdown、オフライン HTML、解析済みメッセージ JSON を選べます。コード、パス、ツール出力を確認してから共有します。JSON はネイティブ rollout のバックアップではなく、Codex がインポートできるとは限りません。原本を保存してください。[エクスポート](/ja/features/export-and-trash)に詳細があります。

## 4. 新規ではなく再開する {#resume}

意図したプロジェクトのディレクトリから実行します。

```bash
codex resume SESSION_ID
```

日付フォルダではなく保存された ID を使います。ターミナル引き継ぎと Codex 内蔵チャットには、CLI のインストール・設定・有効な認証が必要です。続行はプロバイダへの送信、新しい履歴、ツール実行を伴い得ます。プロジェクトと権限モードを確認してください。[再開](/ja/features/resume)と[プライバシー](/ja/guide/privacy)を参照できます。

## CLI と GUI の使い分け {#manual-vs-gui}

| 目的 | 手動 | ビューア |
| --- | --- | --- |
| `cwd`／ID の確認 | `session_meta.payload` を `jq` で読む | プロジェクト別の履歴を選ぶ |
| 忘れた指示を探す | ファイルとイベントを検索 | プロジェクト横断の検索 |
| 本文の重複を避ける | イベントを選び response-item は別に確認 | 解析された会話を読む |
| 同じ会話の続行 | `codex resume SESSION_ID` | 内蔵／外部ターミナルかチャット |

## トラブルと制限 {#limits}

プロジェクトがない場合は別の保存先やユーザーを読んでいる可能性があります。再開失敗は ID、CLI 版、認証を確認します。元ファイルを編集する前に[確認リスト](/ja/guide/troubleshooting)を使ってください。

統計には使用量イベントが必要で、表示コストは推定、契約の利用枠とは別です。[使用量とコスト](/ja/features/stats)を参照できます。

2026-10-05 に 0.6.0 を照合しました。[対応表と合成テスト](/ja/guide/compatibility)はインストール済み Codex CLI 版の実行認証ではありません。
