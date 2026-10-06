---
layout: home
title: Sessions Viewer — Claude Code・Codex・opencode の履歴ビューア
titleTemplate: false
description: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode のローカルセッション履歴を読み、検索し、再開できる無料のデスクトップアプリ。

hero:
  name: Sessions Viewer
  text: 7 つの CLI をひとつのワークスペースに
  tagline: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode はそれぞれ別の場所に別の形式でセッション履歴を保存します。Sessions Viewer はそのすべてを同じ プロジェクト → セッション → 会話 のビューに読み込みます。
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/
    - theme: alt
      text: ダウンロード
      link: https://github.com/jerrywu001/cc-sessions-viewer/releases/latest
    - theme: alt
      text: GitHub
      link: https://github.com/jerrywu001/cc-sessions-viewer

features:
  - title: そのままの再現
    details: 思考チェーン、ツール呼び出しと結果の対応づけ、構造化された diff、貼り付けたスクリーンショットまで、画面で起きたとおりに表示されます。
    link: /ja/features/read-and-search
    linkText: セッション再現のしくみ
  - title: プロジェクト横断の検索
    details: ⌘⇧F で全プロジェクトを一度に検索し、該当するメッセージへ直接ジャンプします。そのセッションで書いたプロンプトはコンパクトな一覧で見渡せます。
    link: /ja/features/read-and-search#finding-a-message
    linkText: 検索とプロンプトへのジャンプ
  - title: 中断したところから再開
    details: 内蔵ターミナルで開き直す、Terminal.app / iTerm2 / Ghostty / Warp / cmux に渡す、あるいはアプリ内チャットでそのまま続ける。モデル・推論の強さ・権限モードはその場で切り替えられます。
    link: /ja/features/resume
    linkText: 再開と継続
  - title: プロジェクトファイルエディター
    details: 全画面ワークスペースでプロジェクトを閲覧・検索し、テキストや Markdown を編集・プレビューして、linked worktree の Git 変更も確認できます。
    link: /ja/features/project-editor
    linkText: プロジェクトエディターのガイド
  - title: トークンとコストの統計
    details: キャッシュした models.dev 価格で記録済み使用量と推定コストを集計します。請求書ではありません。macOS には使用量がある今日・7 日・30 日の合計を表示します。
    link: /ja/features/stats
    linkText: 統計
  - title: ツール管理
    details: 7 つのエージェントの skills・MCP サーバー・hooks・指示ファイルをひとつのパネルに。重複した skill や切れたリンクを見つけ出し、書き込む前に変更されるファイルを必ず提示します。
    link: /ja/tools/
    linkText: skills・MCP・hooks の管理
  - title: ローカルで履歴を閲覧
    details: 履歴の解析・検索・エクスポートはローカル処理です。再開やチャットは設定した CLI／プロバイダを使い、更新・価格・利用枠も通信する場合があります。リネーム、ゴミ箱、設定編集は明示的な書き込みです。
    link: /ja/guide/privacy
    linkText: プライバシーとデータの扱い
---

## Sessions Viewer とは

Sessions Viewer は macOS、Windows、Linux 向けの無料 MIT オープンソースアプリです。ローカルのコーディングエージェント履歴を閲覧・検索・エクスポートでき、7 つともターミナルで再開できます。アプリ内チャットは Claude Code と Codex に対応します。

[保存先・形式・再開方法の比較](/ja/agents/)、[見つからない履歴の確認手順](/ja/guide/troubleshooting)、[通信とプライバシー](/ja/guide/privacy)から目的に合うページへ進めます。

## 目的別の手順と根拠 {#task-guides}

- [Claude Code 履歴の検索・閲覧・保存・続行](/ja/guide/claude-code-session-viewer)
- [Codex rollout のプロジェクト特定と再開](/ja/guide/codex-session-viewer)
- [スキル共有とリンク修復](/ja/tools/share-skills) · [MCP 設定確認](/ja/tools/check-mcp)
- [対応表とダウンロード可能な合成例](/ja/guide/compatibility)
- [プロジェクトと文書の保守](/ja/guide/about)

## 各エージェントのセッションの保存場所

Sessions Viewer は、各 CLI がすでに書き出しているファイルをその場で読みます。リファレンスページではすべてのレイアウトを説明し、アプリなしで記録を読むための `jq` と `sqlite3` のコマンドも載せています。

| エージェント | 既定の場所 | 形式 |
| --- | --- | --- |
| [Claude Code](/ja/agents/claude-code) | `~/.claude/projects/` | 1 セッション 1 JSONL ファイル |
| [Codex](/ja/agents/codex) | `~/.codex/sessions/` | 1 セッション 1 JSONL、日付でバケット分け |
| [Grok Build](/ja/agents/grok-build) | `~/.grok/sessions/` | 1 セッション 1 ディレクトリ |
| [Kimi Code](/ja/agents/kimi-code) | `~/.kimi-code/sessions/` | 1 セッション 1 ディレクトリ |
| [Pi](/ja/agents/pi) | `~/.pi/agent/sessions/` | 1 セッション 1 JSONL ファイル |
| [Antigravity CLI](/ja/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 1 会話 1 ディレクトリ |
| [opencode](/ja/agents/opencode) | `~/.local/share/opencode/opencode.db` | 単一の SQLite データベース |

このアプリは MIT ライセンスの無料オープンソースで、macOS、Windows、Linux で動作します。[最新リリースをダウンロード](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)するか、[ガイド](/ja/guide/)から始めてください。
