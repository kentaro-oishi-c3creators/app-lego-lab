# 発生した問題と原因分析 (Observed Failures & Root Cause Analysis)

本開発ラン（`20261031-antigravity-poc0`）において実際に観測された3件の事象と、その原因・対処を記録する。

---

## F-01: 初回 `npm install` におけるネットワーク `ECONNRESET` と Windows ディレクトリロック (`EPERM`)

- **分類**: 環境要因 / ツール・実行基盤の問題
- **症状**: 初回 `npm install` 実行時、多数のパッケージ同時取得中に `npm error network read ECONNRESET` が発生し、クリーンアップ時に Windows 特有の `EPERM: operation not permitted, rmdir` が発生した。
- **再現手順**: 未キャッシュ状態または高並列ソケット数で `npm install` を実行する。
- **原因**: デフォルトの並列接続数（最大50ソケット）によるレジストリ接続リセット。
- **対処**: `node_modules` を削除後、`npm install --prefer-offline --no-audit --no-fund --maxsockets=4` を実行し、176パッケージが正常にインストールされた（所要約1分）。

---

## F-02: `.agents/agents/graph-engine-worker.md` サブエージェント呼び出し時の書き込み権限不足 (`STATUS: BLOCKED`)

- **分類**: ツール・実行基盤の問題 / エージェント定義の不備
- **症状**: `invoke_subagent` で `graph-engine-worker`（会話ID: `cf787b04-2050-468e-bdea-869a9317d961`）を起動したところ、サブエージェント側に `view_file` 等の読み取り系ツールのみが公開され、`write_file` / `edit_file` が存在しなかったため、サブエージェントがルール通り `STATUS: BLOCKED` を返した。
- **原因**: `.agents/agents/graph-engine-worker.md` および `.agents/agents/ui-play-worker.md` の YAML フロントマターに書き込みツール有効化設定が無く、ハーネスのデフォルトで読み取り専用サンドボックスとして起動されたため（一方 `jidoka-inspector` にとっては読み取り専用が正しい挙動）。
- **対処**: `AGENTS.md` の規定（*"If subagent support differs by client/version, execute roles sequentially without claiming concurrent execution"*）に従い、Coordinator が Graph Engine Role と UI Worker Role を順次実行し、読み取り専用が求められる `jidoka-inspector` はサブエージェントとして独立検査を実行した。

---

## F-03: ブラウザ実機（Chrome CDP）での連続クリック時に発生した React キー重複警告と状態参照のズレ

- **分類**: アプリの不具合（React 18 バッチ更新・Ref同期漏れ）
- **症状**:
  1. Vitest (`fireEvent.click`) では各クリックが個別に `act()` でフラッシュされるため全テストが PASS していたが、ヘッドレス Chrome (CDP) で同一ティック内に複数の `.click()` を連続実行した際、以下の React コンソールエラーが出力された：
     `Warning: Encountered two children with the same key, log-5.`
  2. 同一ティック内で `port-msg-1-sent` を2回連続 `.click()` した際、1回目の `setPendingPort` が再レンダーされる前に2回目のクリックが走り、自己ループ警告が発火しなかった。
- **根本原因**:
  1. `App.tsx` の `appendLog` 内で `logCounterRef.current += 1` を `setEventLog` の外で行い、かつ `id: \`log-${logCounterRef.current}\`` を `setEventLog((prev) => ...)` のアップデータ関数内部で評価していたため、同一ティック内のバッチ更新時に複数のアップデータが最新の同じ `logCounterRef.current` 値を参照してしまった。
  2. `App.tsx` の `history` および `Canvas.tsx` の `pendingPort` がレンダー時のクロージャ変数のみを参照していたため、同一ティック内の同期的な連続クリックで古い状態を参照していた。
- **対処と回帰テスト**:
  1. `appendLog` で `const entryId = \`log-${logCounterRef.current}\`` を `setEventLog` 呼び出し前に確定させるよう修正。
  2. `historyRef` と `pendingPortRef` を導入し、状態更新と同時に Ref を同期更新するよう修正。
  3. `tests/ui-integration.test.tsx` に同一 `act()` 内で6回のネイティブ `.click()` を同期連続実行し、`console.error` が0回であることと状態遷移・警告表示を検証する回帰テストを追加。
  4. 再度 Chrome CDP 実機検証を実行し、`consoleErrors: []`、`pageExceptions: []`、`jumpCount: "2"`、`warningText: "⚠️ [SELF_LOOP] ..."` を確認した。
