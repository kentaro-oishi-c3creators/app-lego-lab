# 技術アーキテクチャ — 小さな型付きイベントグラフ・トイ (Technical Architecture)

## レイヤー構成 (Layers)

```text
Browser Canvas (React + Wa-Modern Washi/Mizuhiki SVG UI)
  ├─ Palette / Preset Scrolls / Karakuri Studio / Undo UI
  ├─ Runtime block views / speech bubbles / animations
  └─ Event Log (からくり過去帳) / Feedback
                  ↓ actions
Graph state + history (typed JSON, pure updates)
  ├─ `validateConnection(graph, proposedEdge)` (pure)
  ├─ `transformKotodama(text, style)` & `encodeGraphToHash` / `decodeGraphFromHash` (pure)
  └─ `dispatchEvent(graph, sourceNodeId, sourcePortId, limits)` (bounded and pure plan)
                  ↓ effects
UI event dispatcher / bounded multi-hop chain driver
  └─ Presentation state: jump/speech/timer-start/play/counter; no arbitrary code execution
```

## データ契約 (Data contracts)

- `BlockType`: `'message' | 'character' | 'timer' | 'media-card' | 'filter' | 'counter'`
- `BlockNode`: `{ id, type, position: {x,y}, data: {label?, durationSeconds?, filterStyle?, targetCount?} }`（ホワイトリスト化されたフィールドのみ許容）
- `BlockEdge`: `{ id, from: {nodeId,portId}, to: {nodeId,portId} }`
- `PortType`: 有効なのは `'trigger'` のみ。`'notification'`（`Character.jumped`）は将来設計の予約としてのみ扱い、有効接続として実装しない（未対応型エラー G02 の検証に使用）。多段連鎖用には `Character.landed` (`'trigger'`) および `Timer.start` (`'trigger'`) を使用する。
- 接続は出力ポート（output）から入力ポート（input）へのみ成立する。両端のノードが存在し、ポートの型シグネチャが一致しなければならない。直接の自己ループ（self-loop）、重複エッジ（duplicate edge）、およびグラフの閉路（cycle）を禁止する。
- `GraphState` がレイアウトとエッジの単一の正本（Single Source of Truth）であり、UIの一時的なアニメーション状態や言霊吹き出し・太鼓カウントは分離して保持する。
- すべての有効なイベントは `{eventId, sourceNodeId, sourcePortId, type, createdAt, traceId, payload?}` を持ち、IDはローカルで生成する。

## 決定論的ランタイム (Deterministic runtime)

1. ユーザーが Send をクリックする（または Timer がカウントダウンを完了する）。
2. ディスパッチャが送信元の出力ポートで `trigger` イベントを生成する。
3. 有向グラフの1ホップ目のエッジを探索し、互換性のある入力ポートにのみイベントを配送する。
4. 到達先の各ブロック種別に対して事前定義された純粋・安全なハンドラを呼び出す：
   - `filter` (`in`): `transformKotodama` でテキストを変換し、自動的に `out` ポートから次段へ中継する。
   - `counter` (`hit`): カウントを `+1` し、`targetCount` に達したときのみリセットして `combo` ポートから次段へ中継する。
   - `character` (`jump`): ジャンプ状態と言霊吹き出しを更新し、`landed` ポートから次段へ中継する。
   - `timer` (`start`): カウントダウンを開始する（カウントダウン完了後に `elapsed` ポートを発火）。
   - `media-card` (`play`): モック再生状態（`PLAYING` / `PAUSED`）をトグルする。
5. UI表示（水引上の言霊玉アニメーション）およびイベントログ用に配送先を記録する。
6. 多重防御（Defense in depth）として、純粋ディスパッチャの `maxHops=8`、`maxDeliveries=32`、訪問済みエッジ／イベントの重複排除（dedup）に加え、UI連鎖ドライバ側でも `MAX_CHAIN_STEPS=8` を強制する。

**なぜ閉路拒否と配送上限の両方が必要か？**
破損したフィクスチャやURLハッシュの読み込み、将来の機能追加によって不正なグラフが渡される可能性があるため、ランタイム側でもフェイルセーフに停止しなければならない。任意のノードコードやユーザー定義のイベントハンドラは絶対に実行しない。

## Undo設計 (Undo design)

グラフを変更する操作に対してスナップショットスタック（最大30件）を使用する。対象はエッジの追加・削除、ブロックの追加・削除・設定変更・移動、プリセット切替、白紙化。一時的なアニメーション状態は履歴に保存しない。

## コンポーネントの責務境界 (Component boundary)

| コンポーネント | 責務 (Responsibility) | 行ってはならないこと (Should not do) |
|---|---|---|
| GraphEngine | エッジ検証、言霊変換、URLハッシュ符号化/無害化復号、上限付きルーティング | DOM操作、`useEffect`、タイマー、ネットワーク通信 |
| BlockKit | 6種のトイブロック描画、型付きポート表示 | グローバルなグラフ状態の直接ミューテーション |
| Canvas | 和紙背景・水引ベジェ曲線と言霊玉の描画、ドラッグ配置、接続、切断 | UIラベル文字列からイベントの意味を推論すること |
| RuntimeDriver | 多段連鎖制御、タイマーのキャンセル管理、エフェクト発火、過去帳記録 | 任意の文字列をコードとして実行すること |
| Inspector | テスト確認、レポート作成、STOP/GO判定 | 承認なしに本番コードを黙って書き換えること |

## プロジェクト構成 (Project target)

```text
src/
  app/App.tsx
  domain/types.ts
  domain/graph.ts
  domain/runtime.ts
  domain/sampleGraph.ts
  components/Canvas.tsx
  components/blocks/{MessageBlock,CharacterBlock,TimerBlock,MediaCardBlock,FilterBlock,CounterBlock}.tsx
  state/history.ts
  styles.css
tests/{graph,dispatch,undo,ui-integration}.test.ts(x)
```
