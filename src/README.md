# Source root (`src/`)

App LEGO PoC 0 の React + TypeScript + Vite 実装ソースコードです。

- `src/domain/types.ts`: ブロック、ポート、グラフ状態、イベント配送結果の型定義
- `src/domain/graph.ts`: 純粋関数による接続検証（`validateConnection`）と不変グラフ更新
- `src/domain/runtime.ts`: 純粋関数による上限付きイベント配送（`dispatchEvent`, `maxHops=8`, `maxDeliveries=32`, 閉路重複排除）
- `src/domain/sampleGraph.ts`: `fixtures/sample-story.json` のサニタイズ読み込みと空グラフ生成
- `src/state/history.ts`: 最大30件のグラフスナップショット Undo 履歴管理
- `src/components/Canvas.tsx`: SVG結線と4種ブロックの配置・移動・ポート接続/切断キャンバス
- `src/components/blocks/`: `MessageBlock`, `CharacterBlock`, `TimerBlock`, `MediaCardBlock`
- `src/app/App.tsx`: アプリケーション統合、タイマー・アニメーション制御、イベントログ、警告表示
