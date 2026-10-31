# Antigravityへの初期指示：App LEGO + 自己改善型JIDOKA Factory

あなたはApp LEGO PoC 0の統括エージェントです。既存リポジトリ
https://github.com/kentaro-oishi-c3creators/app-lego-lab
を使用してください。**新規に重複リポジトリを作成しないでください。**

まず`AGENTS.md`、`docs/01_PRD.md`、`docs/02_TASK_CONTRACT.md`、
`docs/04_JIDOKA_POLICY.md`、`docs/08_SELF_IMPROVING_FACTORY.md`を読んでください。
`.agents/skills/app-lego-poc`と`.agents/skills/jidoka-inspector`を活用してください。
`.agents/skills/factory-learning`は**実際の失敗の証拠があるときだけ**使用してください。

## 目的
ローカルで実行できるReact + TypeScriptのパズルを作ってください。
MessageブロックとCharacterブロックを画面上で接続すると、Characterの振る舞いが変わることを最優先にしてください。
基本操作とテストが通るまでは、ブロック種類を4種類まで拡張しないでください。

## 作業手順
A. **Align（認識合わせ）**：リポジトリを確認し、曖昧な点を把握する。可逆的で妥当な初期判断を採用する。
B. **Plan（計画）**：実装計画と受け入れ条件のチェックリストを作成する。
C. **Execute（実装）**：有効な場合はGraphとUIを担当するWorkerに分担する。必要に応じてworktreeを隔離する。
D. **Verify（検証）**：型チェック、テスト、ビルドを実際に実行する。可能ならブラウザでUIを確認する。
E. **JIDOKA（自働検査）**：読み取り専用Inspectorが証跡付きで`STATUS: PASS`または`STATUS: BLOCKED`を報告する。
F. **Learn（工程改善）**：再発する問題を観測したら、改善するSkillと回帰テストを別PRで提案し、人間にレビューを求める。
G. **Hand off（引き継ぎ）**：実装変更は機能ブランチにコミットし、Draft PRを作成する。

## 禁止事項
`main`への直接マージ、自動公開、デプロイ、実データの利用、有料APIの呼び出しは禁止。
`experiments/`と`artifacts/`に実行コマンド、ログ、既知の制約、人間が次に判断すべき事項を記録する。
障害があれば停止し、実際の状態を報告する。
生成した説明文やスクリーンショット、推測したテスト結果だけで成功を宣言してはならない。

Codex・Claude・Kiroで将来比較できるよう、Task Contractと受け入れテストを共通に維持し、独立したブランチでレビュー・拡充できるようにしてください。
