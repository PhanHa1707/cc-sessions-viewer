---
title: Grok Build のセッション履歴の保存場所
description: Grok Build は $GROK_HOME/sessions/ 配下に 1 セッション 1 ディレクトリで保存し、updates.jsonl が記録本体、summary.json がメタデータです。構成、読むべきファイル、jq コマンド。
---

# Grok Build のセッション履歴の保存場所

Grok Build の表示用履歴は、既定で `~/.grok/sessions/` 配下のセッションディレクトリにある `updates.jsonl` です。`GROK_HOME` で保存先を変更できます。

```
$GROK_HOME/sessions/<エンコードされた cwd>/<セッション ID>/
```

`GROK_HOME` の既定値は `~/.grok` です。相対パスを指定した場合は、シェルのプロンプトで打った相対パスと同じように、ホームディレクトリからではなくカレントディレクトリから解決されます。

## Grok Build のセッションディレクトリの中身

```
updates.jsonl          ← 読みたいのはこれ
summary.json           ← 一覧用メタデータ、info.cwd を含む
chat_history.jsonl     ← モデルへのコンテキスト。表示用の記録ではない
events.jsonl
rewind_points.jsonl
prompt_history.jsonl
prompt_context.json
system_prompt.txt
resources_state.json
announcement_state.json
*.lock
```

このうち 2 つが記録本体に見えますが、本体は 1 つだけです：

- `updates.jsonl` はユーザーに見えるイベントストリームの正本で、CLI が実際に画面へ描いたものです。
- `chat_history.jsonl` はモデルに渡されたもので、圧縮・並べ替えされ、システムの足場が混ざっています。これを記録として読むと、誰の画面にも表示されなかったものが出てきます。

`.lock` ファイルがあるのは、Grok がこれらのファイルを並行して書き込むためです。セッションがまだ生きている可能性があるなら、解析前にコピーを取ってください。

## セッションが属するプロジェクト

グループディレクトリ名にも作業ディレクトリが埋め込まれていますが、正本は `summary.json` です：

```bash
jq -r '.info.cwd' ~/.grok/sessions/*/*/summary.json | sort | uniq -c | sort -rn
```

## Grok Build のセッションをターミナルから読む

ユーザー／アシスタントの表示テキスト片を抽出（ストリーム片は結合しません）：

```bash
jq -r 'select(.method=="session/update" or .method=="_x.ai/session/update")
  | .params.update
  | select(.sessionUpdate=="user_message_chunk" or .sessionUpdate=="agent_message_chunk")
  | .content | if type=="array" then .[] else . end
  | select(.type=="text") | .text // empty' \
  ~/.grok/sessions/<グループ>/<セッション ID>/updates.jsonl
```

記録本体に触れずにタイトルと時刻だけを見る：

```bash
jq '{title, info}' ~/.grok/sessions/<グループ>/<セッション ID>/summary.json
```

1 セッションが 1 ディレクトリなので、削除は 1 ファイルの unlink ではなくフォルダごとの削除です。Grok のセッションを扱うものは、ディレクトリを操作単位として扱う必要があります。

## セッションを再開するには

Grok Build をインストールし、プロジェクトのディレクトリで `grok --resume SESSION_ID` を実行します。アプリは[ターミナルでの再開](/ja/features/resume)に対応し、Grok の内蔵チャットには対応していません。

## 根拠と制限

実装：[Grok Build アダプター](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/grok.rs)。上流入口：[xAI ドキュメント](https://docs.x.ai/)。

<!--@include: ../../.vitepress/snippets/reference-ja.md-->

上の例はテキスト片のみを抽出し、ツール結果、メタデータ、バックグラウンド通知を完全には再現しません。[確認手順](/ja/guide/troubleshooting)を参照してください。

## アプリで開く

[Sessions Viewer](/ja/guide/) は `updates.jsonl` を読み、`chat_history.jsonl` は決して読みません。`info.cwd` でグループ化し、ディレクトリを保存単位として扱います。削除は `rm` を呼ぶ代わりに、フォルダごと復元可能なゴミ箱へ移動します。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
