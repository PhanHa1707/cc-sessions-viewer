---
title: コーディングエージェントの履歴比較：保存先・形式・再開コマンド
description: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode の保存先、記録形式、再開コマンドと Sessions Viewer の対応範囲を比較します。
---

# 各コーディングエージェントのセッション履歴の保存場所

Claude Code と Codex の JSONL は既定で `~/.claude/projects/` と `~/.codex/sessions/`、Pi は `~/.pi/agent/sessions/` にあります。Grok Build、Kimi Code、Antigravity CLI はセッションごとのディレクトリを使います。ここで対応する opencode は単一の SQLite データベースです。既定の場所、プロジェクト情報、再開方法を比較します。

## 既定の場所と形式

| エージェント | 既定の場所 | 記録本体 |
| --- | --- | --- |
| [Claude Code](/ja/agents/claude-code) | `~/.claude/projects/` | `<プロジェクト>/<セッション ID>.jsonl` |
| [Codex](/ja/agents/codex) | `~/.codex/sessions/` | `<YYYY>/<MM>/<DD>/rollout-*.jsonl`、アーカイブは `~/.codex/archived_sessions/` |
| [Grok Build](/ja/agents/grok-build) | `~/.grok/sessions/` | `<グループ>/<セッション ID>/updates.jsonl` |
| [Kimi Code](/ja/agents/kimi-code) | `~/.kimi-code/sessions/` | `<グループ>/<セッション ID>/agents/main/wire.jsonl` |
| [Pi](/ja/agents/pi) | `~/.pi/agent/sessions/` | `<プロジェクト>/<タイムスタンプ>_<uuid>.jsonl` |
| [Antigravity CLI](/ja/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | `<uuid>/.system_generated/logs/transcript*.jsonl` |
| [opencode](/ja/agents/opencode) | `~/.local/share/opencode/opencode.db` | SQLite：`session` → `message` → `part` |

## セッションを再開するには {#resume-commands}

対応する CLI をインストール・設定し、元のプロジェクトで実行します。`SESSION_ID`、`CONVERSATION_ID` やパスは置き換えてください。実行すると CLI が起動し、プロバイダとの通信や書き込みが発生する場合があります。

| エージェント | ターミナルコマンド | アプリ内チャット |
| --- | --- | --- |
| Claude Code | `claude --resume SESSION_ID` | 対応 |
| Codex | `codex resume SESSION_ID` | 対応 |
| Grok Build | `grok --resume SESSION_ID` | 非対応 |
| Kimi Code | `kimi --session SESSION_ID` | 非対応 |
| Pi | `pi --session "/absolute/path/to/session.jsonl"` | 非対応 |
| Antigravity CLI | `agy --conversation CONVERSATION_ID` | 非対応 |
| opencode | `opencode --session SESSION_ID` | 非対応 |

7 つとも履歴の閲覧・検索、エクスポート、ターミナルでの再開に対応します。統計は記録された使用量に依存し、対応する Antigravity CLI の記録には使用量フィールドがありません。[再開ガイド](/ja/features/resume)と[エクスポートガイド](/ja/features/export-and-trash)を参照してください。

## プロジェクト情報の出どころ

| エージェント | ビューアが使うメタデータ |
| --- | --- |
| Claude Code | JSONL の `cwd`。エンコードされたフォルダ名はフォールバックで、逆変換はできない場合がある |
| Codex | `session_meta.payload.cwd` |
| Grok Build | `summary.json` → `info.cwd`、なければグループディレクトリの情報 |
| Kimi Code | セッションのメタデータ／インデックス。`state.json.cwd` が作業ディレクトリを示す |
| Pi | 先頭の `session` レコードの `cwd` |
| Antigravity CLI | `history.jsonl` → `workspace` |
| opencode | `session.project_id` で結合した `project` テーブル |

## 検出できるカスタム保存先

| エージェント | 認識する設定 |
| --- | --- |
| Grok Build | `GROK_HOME`、既定は `~/.grok` |
| Kimi Code | `KIMI_CODE_HOME`、既定は `~/.kimi-code` |
| Pi | `PI_CODING_AGENT_SESSION_DIR`、`settings.json.sessionDir`、`<PI_CODING_AGENT_DIR>/sessions` の優先順 |
| opencode | `XDG_DATA_HOME`、既定は `~/.local/share` |

現在の Claude Code、Codex、Antigravity アダプターはホーム配下の固定場所を読みます。これは**ビューアの制限**であり、CLI 側に別の保存先の設定がないという意味ではありません。Finder やショートカットから起動したアプリには、シェルの環境変数が渡らない場合があります。ファイルを移す前に[確認手順](/ja/guide/troubleshooting)を参照してください。

## アプリなしで読む

各リファレンスに `jq` または読み取り専用の `sqlite3` の例があります。選択したフィールドを抽出するもので、画像・ツール結果・分岐を完全に再現するものではありません。検索可能な画面を使う場合は[ガイド](/ja/guide/)または[インストール](/ja/guide/install)を参照してください。

## 根拠と対象範囲

保存先と再開コマンドは[ソース版 22fefc6 のアダプター](https://github.com/jerrywu001/cc-sessions-viewer/tree/22fefc6/src-tauri/src/agents)と照合しています。各ページに対応する実装と、確認できた上流の入口を記載しています。

<!--@include: ../../.vitepress/snippets/reference-ja.md-->
