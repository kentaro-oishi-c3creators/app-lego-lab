# 技術アーキテクチャ — 小さな型付きイベントグラフ・トイ (Technical Architecture)

## レイヤー構成 (Layers)

```text
Browser Canvas (React + SVG/Canvas UI)
  ├─ Palette / Nodes / Edges / Undo UI
  ├─ Runtime block views / animations
  └─ Event Log / Feedback
                  ↓ actions
Graph state + history (typed JSON, pure updates)
  ├─ `validateConnection(graph, proposedEdge)` (pure)
  └─ `dispatchEvent(graph, sourceNodeId, sourcePortId, limits)` (bounded and pure plan)
                  ↓ effects
UI event dispatcher / state machine
  └─ Presentation state: jump/play/progress; no arbitrary code execution
```

## データ契約 (Data contracts)

- `BlockType`: `'message' | 'character' | 'timer' | 'media-card'`
- `BlockNode`: `{ id, type, position: {x,y}, data: {label?, durationSeconds?} }`（ホワイトリスト化されたフィールドのみ許容）
- `BlockEdge`: `{ id, from: {nodeId,portId}, to: {nodeId,portId} }`
- `PortType`: PoC 0 で有効なのは `'trigger'` のみ。`'notification'` は将来設計の予約としてのみ扱い、PoC 0 では有効接続として実装しない（未対応型エラーの検証に使用）。
- 接続は出力ポート（output）から入力ポート（input）へのみ成立する。両端のノードが存在し、ポートの型シグネチャが一致しなければならない。直接の自己ループ（self-loop）、重複エッジ（duplicate edge）、およびグラフの閉路（cycle）を禁止する。
- `GraphState` がレイアウトとエッジの単一の正本（Single Source of Truth）であり、UIの一時的なアニメーション状態は分離して保持する。
- すべての有効なイベントは `{eventId, sourceNodeId, sourcePortId, type, createdAt, traceId}` を持ち、IDはローカルで生成する。

## 決定論的ランタイム (Deterministic runtime)

1. ユーザーが Send をクリックする（または Timer がカウントダウンを完了する）。
2. ディスパッチャが送信元の出力ポートで `trigger` イベントを生成する。
3. 有向グラフのエッジを探索し、互換性のある入力ポートにのみイベントを配送する。
4. 到達先の各ブロック種別に対して事前定義された `onEvent` ハンドラ（ジャンプ、再生切替など）を呼び出す。
5. UI表示およびイベントログ用に配送先を記録する。
6. 多重防御（Defense in depth）として、1回の起点イベントあたり `maxHops=8`、`maxDeliveries=32`、および訪問済みエッジ／イベントの重複排除（dedup）を強制する。

**なぜ閉路拒否と配送上限の両方が必要か？**
破損したフィクスチャの読み込みや将来の機能追加によって不正なグラフが渡される可能性があるため、ランタイム側でもフェイルセーフに停止しなければならない。任意のノードコードやユーザー定義のイベントハンドラは絶対に実行しない。

## Undo設計 (Undo design)

グラフを変更する操作に対してスナップショットスタック（最大30件など）を使用する。対象はエッジの追加・削除、ブロックの追加・削除、および移動。一時的なアニメーション状態は履歴に保存しない。

## コンポーネントの責務境界 (Component boundary)

| コンポーネント | 責務 (Responsibility) | 行ってはならないこと (Should not do) |
|---|---|---|
| GraphEngine | エッジ検証、グラフ状態の純粋更新、上限付きルーティング | DOM操作、`useEffect`、タイマー、ネットワーク通信 |
| BlockKit | 4種のトイブロック描画、型付きポート表示 | グローバルなグラフ状態の直接ミューテーション |
| Canvas | ドラッグ配置、接続、選択、切断 | UIラベル文字列からイベントの意味を推論すること |
| RuntimeDriver | タイマーのキャンセル管理、エフェクト発火、イベントログ記録 | 任意の文字列をコードとして実行すること |
| Inspector | テスト確認、レポート作成、STOP/GO判定 | 承認なしに本番コードを黙って書き換えること |

## 最小プロジェクト構成 (Minimal project target)

```text
src/
  app/App.tsx
  domain/types.ts
  domain/graph.ts
  domain/runtime.ts
  domain/sampleGraph.ts
  components/Canvas.tsx
  components/blocks/{MessageBlock,CharacterBlock,TimerBlock,MediaCardBlock}.tsx
  state/history.ts
  styles.css
tests/{graph,dispatch,undo,ui-integration}.test.ts(x)
```

ファイル名は例示であり、完璧な階層よりも責務境界の正しさを優先する。

## 開発順序 (Development sequence)

1. `Message.sent -> Character.jump` のクリック動作と単体テスト。
2. 切断・再接続 + Undo の実装と検証。
3. `Timer + Media Card` のモック動作と、タイマークリーンアップの検証。
4. 動作が成立した後にキャンバスのパレットや見た目を整える。

本物の動画プレイヤーは作らない。アイデアの検証にはCSSによるモック表現で十分である。
