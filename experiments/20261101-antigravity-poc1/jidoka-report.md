# JIDOKA 独立品質検査レポート — PoC 1「全部盛りパック ＋ 和モダン・からくり絵巻」

**検査対象ブランチ:** `feat/poc1-all-in-one`
**検査ロール:** `jidoka-inspector`（独立・読み取り専用監査 / ソースコード変更なし）
**最終判定:** `STATUS: PASS`
**検査基準:** [`docs/04_JIDOKA_POLICY.md`](../../docs/04_JIDOKA_POLICY.md) (Gates G01–G07)

---

## 1. ブロッキング品質ゲート (G01–G07) 判定一覧

| Gate ID | ゲート要件 | 判定 | 検証証跡・根拠 (ファイル / 行番号 / テスト・成果物) |
| :--- | :--- | :---: | :--- |
| **G01** | `npm run build` + TypeScript typecheck pass | **PASS** | ・[`artifacts/test-and-build-log.txt`](../../artifacts/test-and-build-log.txt)（UTF-8形式でクリーンに出力済み）にて以下を確認：<br>  - `npm run typecheck` (`tsc --noEmit`): exit code `0`<br>  - `npm test` (`vitest run`): 4ファイル・全26テスト PASS (exit code `0`)<br>  - `npm run build` (`tsc --noEmit && vite build`): 43モジュール変換完了、`dist/` 生成成功 (exit code `0`) |
| **G02** | 正常・不正接続、重複、自己ループ、閉路（サイクル）の単体テストと不変性保証 | **PASS** | ・[`src/domain/types.ts`](../../src/domain/types.ts) および [`src/domain/graph.ts`](../../src/domain/graph.ts): 新ブロック `filter` (`in`/`out`), `counter` (`hit`/`combo`)、および連鎖用ポート `character.landed` (`trigger`), `timer.start` (`trigger`) を型安全に定義しつつ、`character.jumped` (`notification`, `supportedInPoc0: false`) を予約ポートとして維持。<br>・`validateConnection` および `addEdge` による不正エッジ拒否と参照不変性を維持。<br>・[`tests/graph.test.ts`](../../tests/graph.test.ts)（全11テスト PASS）にて、従来の全G02ケースに加え、新プリセット3種（五段連鎖・三連太鼓・千本桜）およびURLハッシュ復号・無害化のグラフ検証を確認。 |
| **G03** | 偽装された閉路・長大グラフに対する有界イベント配送 (Bounded Dispatch) | **PASS** | ・[`src/domain/runtime.ts`](../../src/domain/runtime.ts): `DEFAULT_MAX_HOPS = 8`、`DEFAULT_MAX_DELIVERIES = 32`、`visitedEdgeIds` 重複排除を維持（[`tests/dispatch.test.ts`](../../tests/dispatch.test.ts) 全5テスト PASS）。<br>・さらに [`src/app/App.tsx`](../../src/app/App.tsx) にて多段連鎖（`Filter.out` / `Character.landed` / `Counter.combo`）に対しても `MAX_CHAIN_STEPS = 8` の多段再帰上限ガードが二重の安全弁として実装されていることを確認。 |
| **G04** | 切断（Remove）で反応停止 → Undo で接続復元・反応再開 | **PASS** | ・[`tests/undo.test.ts`](../../tests/undo.test.ts)（全3テスト PASS）および [`tests/ui-integration.test.tsx`](../../tests/ui-integration.test.tsx) で切断時の無反応化と Undo 後の反応再開を検証。<br>・[`artifacts/browser-verification-report.json`](../../artifacts/browser-verification-report.json) でも実ブラウザ上の切断・Undo 動作（`countAfterDisconnectedSend: "1"`, `countAfterUndoAndSend: "2"`）を確認。 |
| **G05** | タイマーの1回発火およびアンマウント/ブロック削除時のクリーンアップ | **PASS** | ・[`src/components/blocks/TimerBlock.tsx`](../../src/components/blocks/TimerBlock.tsx): `isRunningRef` による二重起動防止、`hasFiredRef` による単発発火保証、`startSignal` による着地連鎖起動、および `useEffect` アンマウント時の `clearTimers()` を実装。<br>・[`tests/ui-integration.test.tsx`](../../tests/ui-integration.test.tsx)（単発発火・途中削除時のキャンセル検証、および五段連鎖での2秒砂時計自動起動→満了時の絵巻演舞トグル）で PASS。 |
| **G06** | `eval`・動的コード実行・未承認通信・トークン・個人情報の不在 (静的監査) | **PASS** | 新規追加された3つの主要機能を含め、全ソースコードを重点監査し安全性を確認：<br>1. **URLハッシュ共有 (`encodeGraphToHash` / `decodeGraphFromHash`)**: [`src/domain/sampleGraph.ts`](../../src/domain/sampleGraph.ts) にて `TextEncoder`/`TextDecoder` と Base64URL のみを使用し、デコード後のオブジェクトを必ず `sanitizeGraph(parsed)` に通して未知のブロック型・不正プロパティ・不正エッジを完全排除。<br>2. **言霊変換 (`transformKotodama`)**: [`src/domain/graph.ts`](../../src/domain/graph.ts) にて入力文字列を40文字に切り詰めた純粋な定型文字列フォーマット（`bushido` / `miyabi` / `kansai`）として実装。`eval`・`new Function`・外部API通信は一切なし。<br>3. **からくり工房 (`handleCraftSummon` / `sanitizeNodeData`)**: [`src/app/App.tsx`](../../src/app/App.tsx) および [`src/domain/graph.ts`](../../src/domain/graph.ts) にて、許可された6種の `BlockType` のみを対象とし、ラベルから `[<>]` を除去・最大40〜60文字制限、秒数 `1〜5`、太鼓数 `2〜5`、スタイル3種へのクランプを実施。外部ネットワーク通信や動的コード生成はゼロ。 |
| **G07** | デスクトップ標準表示での主要UIコントロールの視認性・クリッピングなし | **PASS** | ・[`artifacts/browser-verification-report.json`](../../artifacts/browser-verification-report.json): `1280x860` ビューポートにて `consoleErrors: []`, `pageExceptions: []`, `allVisibleAndUnclipped: true`。<br>・新規追加された `toggle-studio-btn`, `share-url-btn`, プリセット4ボタン (`preset-btn-*`), `add-filter-btn`, `add-counter-btn` を含む全21個の主要コントロールすべてで `clipped: false` を確認。 |

---

## 2. 軽微な改善メモへの対応

- **`prefers-reduced-motion: reduce` における SVG 光球アニメーション**:
  - 指摘を受け、[`src/styles.css`](../../src/styles.css) の `@media (prefers-reduced-motion: reduce)` 内に `.kotodama-orb { display: none; }` を追加し、動き軽減設定時に SVG `<animateMotion>` の光球も非表示になるよう改善済み。

---

## 最終判定

```text
STATUS: PASS
All JIDOKA Blocking Gates (G01, G02, G03, G04, G05, G06, G07) passed for PoC 1 (feat/poc1-all-in-one).
Zero blocking issues found. Ready for human evaluation and showcase.
```
