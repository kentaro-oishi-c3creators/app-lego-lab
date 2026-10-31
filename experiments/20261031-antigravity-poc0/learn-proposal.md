# Factory Learning / POKA-YOKE 改善提案書 (`learn-proposal.md`)

`docs/08_SELF_IMPROVING_FACTORY.md` および `.agents/skills/factory-learning/SKILL.md` に基づき、今回の開発・実機検査で実際に観測された不具合（`F-02`, `F-03`）の再発防止策を提案する。
**※本提案は実装PR（`feat/poc0-antigravity`）とは分離し、別ブランチ・別PR（`chore/skills-sync-click-and-subagent`）として人間のレビューに提出する。**

---

## 1. 症状と再現可能な証拠

### 証拠 A (`F-03`: 同一ティック連続操作時の React キー重複と Stale Closure)
- **発生箇所**: `src/app/App.tsx` (`appendLog`, `handleConnect`, `handleDisconnectEdge`), `src/components/Canvas.tsx` (`handlePortClick`)
- **発見手段**: Chrome CDP 実機テスト (`artifacts/browser-verification-report.json` 初回実行ログ `task-130`)
- **症状**:
  - `Testing Library` の `fireEvent.click` は1クリックごとにレンダーをフラッシュするため単体テストでは検出されなかったが、実ブラウザ上で高速・同期的に複数ボタン（切断→送信→Undo→送信、または同一ポートの2連続クリック）が押された際、`setEventLog((prev) => [{ id: \`log-${logCounterRef.current}\` }])` がバッチ処理されて同一キー `log-5` が生成され、また `pendingPort` が未反映のまま2回目のクリックが空振りした。

### 証拠 B (`F-02`: ワークスペースカスタムエージェントのツール権限の明文化不足)
- **発生箇所**: `.agents/agents/graph-engine-worker.md`, `.agents/agents/ui-play-worker.md`, `.agents/skills/app-lego-poc/SKILL.md`
- **発見手段**: サブエージェント `cf787b04-2050-468e-bdea-869a9317d961` が `write_file` 未所持により `STATUS: BLOCKED` を返却。

---

## 2. 推定原因と不確実な点

- **推定原因**:
  1. React 18 の Automatic Batching により、イベントハンドラやアップデータ関数内で `useRef.current` を直接テンプレート文字列に埋め込むと、バッチ実行時に最終値へ収束して重複キーになる。また、ポート選択や履歴操作を連続実行するUIでは、State と Ref を同期しないとバッチ境界内の2手目が古いクロージャを見る。
  2. Antigravity のバージョン・環境によって `.agents/agents/*.md` のカスタムサブエージェントに書き込みツールが付与されない場合がある。
- **不確実な点**:
  - 将来のハーネス更新で `.agents/agents/*.md` のフロントマター仕様が拡張される可能性があるため、エージェント定義側だけでなく `.agents/skills/app-lego-poc/SKILL.md` 側にもフォールバック手順と React バッチ更新の注意点を明記するのが最も堅牢である。

---

## 3. Skill・エージェント定義への変更案

1. **`.agents/skills/app-lego-poc/SKILL.md` への追記**:
   - イベントログ等の連番ID採番時は、`setState` アップデータ関数の**外側**でID文字列を確定させること（React 18 Automatic Batching / StrictMode での重複キー防止）。
   - 2クリック接続（`pendingPort`）や履歴更新（`history`）など連続クリックされる状態は、`useRef` を併用して同一ティック内の連続イベントでも最新状態を参照できるようにし、単体テストでも同一 `act()` 内のネイティブ `.click()` 連続呼び出しおよび `console.error` スパイによる検証を行うこと。
   - カスタムサブエージェント（`graph-engine-worker`, `ui-play-worker`）が読み取り専用サンドボックスとして起動された場合は、無理に回避せず Coordinator が順次ロールを実行し、読み取り専用の `jidoka-inspector` で独立監査を行うこと。

---

## 4. 回帰テストと測定可能な受け入れ基準

- **回帰テスト**: `tests/ui-integration.test.tsx` の `"Regression (Poka-yoke): synchronous rapid multi-action clicks preserve state and unique log keys without console errors"`
- **測定可能な受け入れ基準**:
  - `vitest run` で上記回帰テストを含む全22テストが PASS し、`console.error` が 0 回であること。
  - ヘッドレス Chrome CDP 実機検証で `consoleErrors: []`, `pageExceptions: []` であること。

---

## 5. 変更によって不具合を隠してしまうリスク

- `console.error` をテスト内で `mockImplementation` する際、アサーション（`expect(errorSpy).not.toHaveBeenCalled()`）を忘れると逆にエラーを隠蔽するリスクがある。そのため、必ず `expect(errorSpy).not.toHaveBeenCalled()` と `errorSpy.mockRestore()` をセットにするルールを明記する。品質ゲート（G01〜G07）は一切緩和しない。

---

## 6. ロールバック手順

```bash
git revert <commit-sha-of-skill-update>
# または別PR (chore/skills-sync-click-and-subagent) をクローズして破棄する
```
