---
title: Claude Code のセッション履歴の保存場所
description: Claude Code は 1 セッション 1 つの JSONL 記録を ~/.claude/projects/ 配下に書き出します。ディレクトリ構成、レコード形式、構造化された diff、ターミナルから読む jq コマンド。
---

# Claude Code のセッション履歴の保存場所

Claude Code はセッションごとに 1 つの JSONL ファイルをホーム配下に書き出します：

```
~/.claude/projects/<プロジェクトディレクトリ>/<セッション ID>.jsonl
```

`<セッション ID>` は `claude --resume` に渡す UUID です。一部の CLI バージョンは `sessions-index.json` も管理しますが、Sessions Viewer はそのインデックスなしで JSONL を走査できます。

## プロジェクトディレクトリ名の作られ方

Claude Code は、プロジェクトの絶対パスに含まれる `/` を先頭のものも含めてすべて `-` に置き換え、ディレクトリ名を作ります：

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

Windows の区切り文字とドライブのコロンも置換されます（`E:\work\blog` → `E--work-blog`）。名前にダッシュを含む場合は逆変換できません。プロジェクトの確認にはフォルダ名だけでなく、レコードの `cwd` を優先してください。

## Claude Code のレコードの形

1 行 1 つの JSON オブジェクトで、`type` で区別します：

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

会話は `message.content` の配列に、ブロックとして入っています：

| ブロックの `type` | 内容 |
| --- | --- |
| `text` | 通常のテキスト |
| `thinking` | 拡張思考（モデルが生成した場合のみ） |
| `tool_use` | ツール呼び出し：`name` と `input` オブジェクト |
| `tool_result` | 結果。`tool_use_id` で呼び出しと対応づく |
| `image` | 貼り付けた画像は `source.base64`、参照は `source.url` |

レコードレベルには他の `type` もあります。セッションをリネームしたときの `custom-title` などです。

### 構造化された diff {#structured-diffs}

ファイル編集の `tool_result` には `structuredPatch` フィールドが付くことが多く、これはテキストの塊ではなくハンク単位に分解済みの diff です。このフィールドがあるからこそ、編集を本物の diff として描画できます。

## Claude Code のセッションをターミナルから読む

ユーザーとアシスタントのテキストを抽出（ツールや画像は含みません）：

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content
  | if type=="string" then . else .[]? | select(.type=="text") | .text end' \
  ~/.claude/projects/-Users-me-apps-blog/<セッション ID>.jsonl
```

どのツールを何回呼んだかを集計：

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

特定のファイルに触れたセッションを探す：

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## セッションを再開するには

Claude Code をインストールし、プロジェクトのディレクトリで `claude --resume SESSION_ID` を実行します。アプリの[ターミナルまたは内蔵チャット](/ja/features/resume)でも再開できます。続行時には設定したプロバイダへの通信や新しい記録の追記が発生する場合があります。

## 根拠と制限

実装：[Claude Code アダプター](https://github.com/jerrywu001/cc-sessions-viewer/blob/22fefc6/src-tauri/src/agents/claude.rs)。上流：[Claude Code ドキュメント](https://code.claude.com/docs/en/overview)。

<!--@include: ../../.vitepress/snippets/reference-ja.md-->

見つからない場合は[確認手順](/ja/guide/troubleshooting)を参照してください。

## アプリで開く

手順と手動／GUI の使い分けは [Claude Code の検索・保存・再開](/ja/guide/claude-code-session-viewer)を参照してください。

[Sessions Viewer](/ja/guide/) はこれらのファイルを直接読みます。対応する記録済みの思考、ツールの対応づけ、`structuredPatch` diff、画像を読みやすく表示します。履歴閲覧は元ファイルを書き換えません。Claude Code を選択すると `⌘⇧F` でそのタイトルとユーザープロンプトを横断検索できます。[検索と表示の制限](/ja/features/read-and-search#search-scope)を確認してください。[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
