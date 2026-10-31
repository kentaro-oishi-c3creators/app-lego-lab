# App LEGO Lab — ソフトウェアをブロックのように組み合わせて遊ぶ (PoC 0)

**ステータス: PoC 0 実装完了（ローカル実行・決定論的イベントグラフ）**
2026-10-31 Antigravity Deep Dive ハッカソン向けに実装・検証済み。

> Connect. Play. Break. Remix. **まず「モジュールをつなぐこと自体が楽しいか」を確かめる。**

本リポジトリは、小さなアプリ風ブロックを組み合わせて遊ぶプライバシー安全な実験用 PoC（PoC 0）です。LEGO、LINE、YouTube 等のクローンではありません。`App LEGO` はプロジェクト内部の仮称（Working nickname）です。

## 1文で表す実験内容 (One-sentence experiment)

初めてのユーザーが説明なしで4種類のトイブロックを配置・配線し、思いがけない反応を観察し、線を切って反応が止まることを確かめ、Undo（元に戻す）で復元できるか？

**PoC 0** は実行時に完全オフライン・決定論的に動作します。実行時の LLM/AI API 呼び出し、アカウント認証、クラウド保存、外部通信、課金、実データの取り込み、任意コード実行（`eval` 等）は一切行いません。

---

## クイックスタート & コマンド一覧

Node.js (v20+ / v22推奨) 環境で以下のコマンドを実行できます。

```bash
# 1. 依存パッケージのインストール
npm install

# 2. ローカル開発サーバーの起動 (http://localhost:5173)
npm run dev

# 3. TypeScript 型チェック (strict: true)
npm run typecheck

# 4. 自動テストの実行 (Vitest: グラフ検証・有界ディスパッチ・Undo・UI統合テスト)
npm test

# 5. 本番ビルドの検証 (tsc --noEmit && vite build)
npm run build
```

---

## デモ操作手順 (Demo Steps)

1. **起動と初期サンプル確認**：`npm run dev` でブラウザを開くと、`Message → Character` と `Timer → Media Card` が配線されたサンプルグラフが表示されます。
2. **Message → Character の動作確認**：`Message (msg-1)` ブロックの **「📨 Send (送信)」** ボタンを押すと、`sent → jump` の線を通って `Character (char-1)` がジャンプし、ジャンプ回数（Jumps）が `+1` され、左下の **Event Log** に `msg-1.sent -> char-1.jump` が記録されます。
3. **切断 (Disconnect)**：キャンバス上の結線にある **「✂️ 切断」** ボタン（または画面下部「接続中」バーの **「切断」** ボタン）を押してから **「📨 Send (送信)」** を押すと、Character はジャンプせず、ログに `unhandled`（未接続）と記録されます。
4. **元に戻す (Undo)**：上部ツールバーの **「↩️ Undo (元に戻す)」** を押すと接続が復元され、再度 **「📨 Send (送信)」** を押すと Character が再びジャンプします。
5. **Timer → Media Card の動作確認**：`Timer (timer-1)` の **「▶️ Start Timer (3s)」** を押すと、3秒のカウントダウン後に `elapsed` イベントが1回だけ発火し、`Media Card (media-1)` のモック再生状態（`PLAYING` / `PAUSED`）が切り替わります。カウントダウン中に Timer ブロックを削除（`✕`）するとタイマーは安全にクリーンアップされ、発火しません。
6. **不正な接続の拒否 (Poka-yoke)**：
   - 同じブロックのポート同士（自己ループ：`msg-1.sent -> msg-1.sent`）
   - 出力ポート同士（`msg-1.sent -> timer-1.elapsed`）や入力ポート同士（`char-1.jump -> media-1.play`）
   - 予約済み・未対応ポート（`char-1.jumped [notification] -> media-1.play`）
   - 閉路（サイクル）や重複接続
   を試みると、上部にわかりやすい警告バナーが表示され、グラフ構造は一切変更されません。
7. **組み替え・空キャンバス・リセット**：
   - 線を切って `Message.sent -> MediaCard.play` や `Timer.elapsed -> Character.jump` のように繋ぎ替えて遊ぶことも可能です。
   - **「🧹 Empty Canvas (空にする)」** でゼロからブロックを配置でき、**「🔄 Reset Demo (初期状態へ)」** でいつでも初期サンプルに戻せます。

---

## 設計上の制限事項 (Known Limitations)

- **PoC 0 スコープ限定**：ブロック種別は `message`, `character`, `timer`, `media-card` の4種のみです。
- **予約ポート (`Character.jumped: notification`)**：将来構想のアイデアを示すためUI上に点線（予約）として表示しており、接続を試みると未対応イベント型（`UNSUPPORTED_PORT_TYPE`）として安全に拒否されます。
- **Undo履歴**：グラフ構造（ノードの追加・削除・移動完了時の座標、エッジの接続・切断、空キャンバス化）のスナップショットを最大30件保持します。ジャンプ中などの一時的なアニメーション状態は履歴に含めません。
- **メディア再生**：`Media Card` はCSSによる視覚的モックであり、実際の音声・動画ストリームは再生しません。

---

## プロジェクト構成 (Project Layout)

```text
AGENTS.md                   エージェント作業ルールと厳格な安全境界
.agents/agents/             Antigravity サブエージェント定義 (Graph / UI / JIDOKA Inspector)
.agents/skills/             ワークスペース Skills (app-lego-poc, jidoka-inspector, factory-learning)
docs/01_PRD.md              プロダクト仕様書・受け入れシナリオ
docs/02_TASK_CONTRACT.md    タスク契約書（目標・非目標・制約・完了条件）
docs/03_ARCHITECTURE.md     型付きイベントグラフ・有界ランタイム設計
docs/04_JIDOKA_POLICY.md    JIDOKA ブロッキング品質ゲート (G01–G07)
docs/05_RUNBOOK.md          ハッカソン実行ランブック
docs/06_MODEL_COMPARISON.md モデル・エージェント横断比較実験計画
docs/07_PROVENANCE.md       出典・プライバシー境界・名称に関する注意
docs/08_SELF_IMPROVING_FACTORY.md 自己改善型 JIDOKA Factory の原則
docs/09_MULTI_AGENT_HANDOFF.md    Antigravity / Codex / Claude / Kiro 横断レビュー契約
fixtures/sample-story.json  初期サンプルグラフデータ（架空データのみ）
src/domain/                 純粋関数による型付きグラフ検証・有界イベント配送
src/state/history.ts        決定論的スナップショットによる Undo 履歴管理
src/components/             4種のブロックコンポーネントとインタラクティブ Canvas
src/app/App.tsx             パレット・ツールバー・RuntimeDriver・イベントログ統合
tests/                      単体テストおよび React UI 統合テスト (G02–G05)
experiments/                実行ごとの再現可能な実験・検査記録
artifacts/                  スクリーンショット・テストログ等の証跡
```

## プライバシー・安全性の分離

個人の自己分析プロジェクトや社外秘・顧客データは一切含めていません。すべてのラベル・テキストは架空のサンプルデータです。
