---
title: Kimi Code のセッション履歴の保存場所
description: Kimi Code は ~/.kimi-code/sessions/ 配下に 1 セッション 1 ディレクトリで保存し、state.json がメタデータ、agents/main/wire.jsonl が記録本体です。構成と、セッションを読む jq コマンド。
---

# Kimi Code のセッション履歴の保存場所

Kimi Code の主な記録は、既定で `~/.kimi-code/sessions/` 配下のセッションディレクトリにある `agents/main/wire.jsonl` です。`KIMI_CODE_HOME` で保存先を変更できます：

```
$KIMI_CODE_HOME/sessions/wd_<名前>_<ハッシュ>/session_<uuid>/
```

`KIMI_CODE_HOME` の既定値は `~/.kimi-code` です。そのディレクトリの直下にフラットなインデックスもあります：

```
~/.kimi-code/session_index.jsonl
```

## wd_ グループディレクトリ

`wd_` は working directory の略です。その後ろに続くのはプロジェクトフォルダ自体の名前と、フルパスの短いハッシュです：

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

このハッシュがあるおかげで、親ディレクトリの異なる同名の `blog` が同じバケットに落ちません。つまりディレクトリ一覧だけでプロジェクトを区別できます。

## Kimi Code のセッションディレクトリの中身

```
state.json                 ← セッションのメタデータ
agents/main/wire.jsonl     ← 記録本体
logs/
media/
```

`agents/main/` 配下の `wire.jsonl` が主たる記録です。`agents/` という階層があるのは、1 つのセッションで複数のエージェントを走らせられるためで、`main` が実際に会話した相手です。

## Kimi Code のセッションをターミナルから読む

インデックスのセッション ID とタイトルを一覧（会話本文ではありません）：

```bash
jq -r '[.sessionId, .title] | @tsv' ~/.kimi-code/session_index.jsonl
```

主イベント形式からユーザー入力とアシスタントのテキストを抽出：

```bash
jq -r 'if .type=="turn.prompt" then
    select((.origin.kind // "user")=="user") | .input
    | if type=="string" then . else .[]? | select(.type=="text") | .text end
  elif .type=="context.append_loop_event" and .event.type=="content.part" then
    .event.part | select(.type=="text") | .text
  else empty end' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

セッションのメタデータを見る：

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## セッションを再開するには

Kimi Code をインストールし、プロジェクトのディレクトリで `kimi --session SESSION_ID` を実行します。アプリは[ターミナルでの再開](/ja/features/resume)に対応し、Kimi の内蔵チャットには対応していません。

## 根拠と制限

実装：[Kimi Code アダプター](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/kimi.rs)。上流：[Kimi Code リポジトリ](https://github.com/MoonshotAI/kimi-cli)。

<!--@include: ../../.vitepress/snippets/reference-ja.md-->

旧 `context.append_message` は別形式で、アダプターにはフォールバックがあります。上の例は主イベントのみを対象にし、ツール出力を結合しません。[確認手順](/ja/guide/troubleshooting)を参照してください。

## アプリで開く

[Sessions Viewer](/ja/guide/) は `wire.jsonl` を他のエージェントと同じ会話ビューに読み込み、`media/` の添付をインライン表示し、リネームと削除をセッションディレクトリ単位で扱います。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
