---
title: Sessions Viewer とドキュメントの保守について
description: Sessions Viewerは公開GitHubで保守するMITライセンスの独立デスクトップアプリです。文書の実装根拠とCLI検証の制限を明示します。
---

# Sessions Viewer について

ローカルの coding agent 履歴とツール設定を扱う、独立した MIT ライセンスのデスクトップアプリです。公開リポジトリは [jerrywu001/cc-sessions-viewer](https://github.com/jerrywu001/cc-sessions-viewer) です。Anthropic、OpenAI、ほかの agent ベンダーの公式製品ではありません。

## プロジェクトと保守 {#maintenance}

- **名前：**Sessions Viewer。リポジトリには以前の `cc-sessions-viewer` 名が残っています。
- **正式な文書：**[sessions-viewer.js-bridge.com](https://sessions-viewer.js-bridge.com)。
- **ソース／ライセンス：**[GitHub](https://github.com/jerrywu001/cc-sessions-viewer) と [MIT](https://github.com/jerrywu001/cc-sessions-viewer/blob/main/LICENSE)。
- **インストーラとリリースノート：**[Releases](https://github.com/jerrywu001/cc-sessions-viewer/releases)。文書と配布版は別々に更新され得るため、導入版を確認してください。
- **保守：**README に余暇での保守と記載されています。ここでは回答期限や商用サポートを保証しません。

## 文書の確認方法 {#documentation-evidence}

2026-10-05 に 0.6.0、ソース版 `22fefc6` を照合しました。各リファレンスは実装をリンクします。文書の `jq`／SQL は公開の合成データでテストし、個人の履歴やプロバイダ通信・再開を使いません。

[検証表](/ja/guide/compatibility)は実装照合、コマンドテスト、CLI 実行を区別します。実際に実行していない版は未検証です。日付は実際のレビューを示し、上流の最新形式への自動保証ではありません。

## 報告と改善 {#feedback}

再現可能な不具合や文書修正は [GitHub issues](https://github.com/jerrywu001/cc-sessions-viewer/issues)、改善は PR で報告できます。アプリ／CLI の版、OS、操作、最小の合成／匿名化例を添付します。API キー、未加工の会話、個人の DB は公開しないでください。

エクスポートや設定画面を共有する前に[プライバシー](/ja/guide/privacy)を確認してください。[Claude Code](/ja/guide/claude-code-session-viewer)、[Codex](/ja/guide/codex-session-viewer)、[ツール管理](/ja/tools/)の手順から使い始められます。
