---
title: Pi のセッション履歴の保存場所
description: Pi は既定で ~/.pi/agent/sessions/ に JSONL を保存します。保存先の優先順、ネストした本文の抽出、ファイルパスによる再開を説明します。
---

# Pi のセッション履歴の保存場所

Pi の既定の保存先は `~/.pi/agent/sessions/` です。セッションごとに JSONL ファイルを作り、`session` ヘッダーとメッセージ／ツリーのエントリを保存します：

```
<セッションルート>/--<エンコードされたプロジェクトパス>--/<タイムスタンプ>_<uuid>.jsonl
```

実際のパスはこうなります：

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

ファイル名は ISO 8601 のタイムスタンプで始まるため、単に `ls` するだけで時系列に並びます。

## セッションルートの決まり方

Pi のルートは 3 か所で設定でき、優先順位は次のとおりです：

1. 環境変数 `PI_CODING_AGENT_SESSION_DIR`（設定済みかつ空でない場合）
2. `<agent ディレクトリ>/settings.json` の `sessionDir`
3. 既定値の `<agent ディレクトリ>/sessions`

agent ディレクトリ自体は `PI_CODING_AGENT_DIR` で指定し、既定値は `~/.pi/agent` です。何も設定しなければセッションは `~/.pi/agent/sessions` に入ります。

一回限りの `--session-dir` は Sessions Viewer の走査範囲外に書き込む場合があります。一覧に出なくてもファイルが存在する可能性があります。保存先の設定を合わせ、未検出を削除と取り違えないでください。

## プロジェクトディレクトリ名

プロジェクトの絶対パスの `/` を `-` に置換し、前後を `--` で囲んだものです：

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

ディレクトリ名は手がかりですが、逆変換できるとは限りません。アダプターは先頭の `session` レコードの `cwd` をプロジェクトの根拠として使います。

## agent ディレクトリのその他の中身

```
~/.pi/agent/
├── sessions/
├── extensions/          ← ライフサイクル拡張
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← 認証情報。読まないこと
```

履歴の確認には認証ファイルではなくセッションファイルを使ってください。Sessions Viewer は保存先の解決のために `settings.json` も読みます。ツール管理は別の機能です。

## Pi のセッションをターミナルから読む

保存済みのユーザー／アシスタントのテキストを抽出（現在以外の分岐も含みます）：

```bash
jq -r 'select(.type=="message") | .message
  | select(.role=="user" or .role=="assistant") | .content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

あるプロジェクトの最新セッション：

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

プロジェクトごとのセッション数：

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## セッションを再開するには

Pi をインストールし、プロジェクトのディレクトリで `pi --session "/absolute/path/to/session.jsonl"` を実行します。指定するのは UUID だけではなく**ファイルのパス**です。アプリは[ターミナルでの再開](/ja/features/resume)に対応し、Pi の内蔵チャットには対応していません。

## 根拠と制限

実装：[Pi アダプター](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/pi.rs)。上流：[Pi ドキュメント入口](https://pi.dev/)。

<!--@include: ../../.vitepress/snippets/reference-ja.md-->

Pi はエントリ ID と親 ID で分岐を保存します。上のコマンドは保存テキストをファイル順に読み、現在の分岐を再構成しません。[確認手順](/ja/guide/troubleshooting)を参照してください。

## アプリで開く

[Sessions Viewer](/ja/guide/) は Pi と同じ順序でセッションルートを解決し（環境変数、次に `settings.json`、最後に既定値）、セッション記録だけを読みます。隣にある auth や認証情報のファイルには一切触れません。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
