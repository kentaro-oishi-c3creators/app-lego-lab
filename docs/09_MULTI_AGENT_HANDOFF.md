# Antigravity / Codex / Claude / Kiro 横断レビュー

## 共通の契約
すべてのツールは、ルートの`AGENTS.md`、`docs/02_TASK_CONTRACT.md`、
`docs/04_JIDOKA_POLICY.md`、`docs/08_SELF_IMPROVING_FACTORY.md`を必ず読む。

## 推奨ブランチ名
- `feat/poc0-antigravity`：主実装
- `review/poc0-codex`：独立したコード／テストレビュー
- `review/poc0-claude`：設計・UX・例外系のレビュー
- `review/poc0-kiro`：要件・設計・タスクの追跡可能性のレビュー
- `chore/skills-<issue>`：Factory改善案（人間によるレビューが必須）

## レビュー確認事項
1. 当初のTask Contractに沿って動いているか。
2. 型安全性、イベント伝播の上限、Undo、不正な接続の拒否がテストされているか。
3. 実際には実行していないテストを、実行済みと報告していないか。
4. Browser Subagentの証跡と実装が一致しているか。
5. 安全性の検査を回避したり、品質基準を緩めたりしていないか。
6. オフライン、ローカル限定、個人情報を含まない前提を守っているか。
7. 提案したSkill改善には、再現可能な失敗の証拠があるか。

各ツールによる独立レビューを`experiments/<run>/`にMarkdownとして残し、個別の指摘はPRコメントに記録する。
自動マージや、レビューされていない本番デプロイは行わない。

## AIツール間の比較
モデルID・バージョン、実行基盤、プロンプトのハッシュ、契約文書のリビジョン、テスト出力、所要時間、人間の介入回数、主な不具合、概算費用を記録する。
裏側で使うモデルが異なる場合は、同一条件のモデル比較として扱わない。
