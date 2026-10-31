# Test suites (`tests/`)

Vitest + Testing Library による自動テストスイートです（`npm test` で実行）。

- `tests/graph.test.ts`: 正常接続、逆方向（出力→出力、入力→入力、入力→出力）、未対応ポート、重複エッジ、自己ループ、2ノード/3ノード閉路の拒否、および拒否時のグラフ不変性検証（Gate G02）
- `tests/dispatch.test.ts`: 正常配送、切断時の未処理判定、強制的な閉路グラフでの訪問済みエッジ重複排除、`maxHops=8` および `maxDeliveries=32` による上限停止検証（Gate G03）
- `tests/undo.test.ts`: 切断後の Undo による接続・イベント伝播の復元、追加操作の Undo、履歴上限（30件）の検証（Gate G04）
- `tests/ui-integration.test.tsx`: `Message → Character` の送信・ジャンプ・切断・Undo 復元、不正接続時の警告表示、`Timer → Media Card` の3秒カウントダウン1回発火およびブロック削除時のタイマークリーンアップ検証（Gate G04, G05）
