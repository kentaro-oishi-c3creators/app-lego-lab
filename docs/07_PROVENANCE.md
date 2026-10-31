# 出典と設計判断の経緯 (Provenance and Design Decisions)

本ハッカソン用スキャフォールドは、**2026年10月16日の C³ Creators Google Drive 企画メモ**をもとに準備された。元の構想メモ自体は変更せず、本プロジェクトでは提案された `PoC 0` を明確な実装契約（Task Contract）へと絞り込んでいる。具体的なデータスキーマ、Worker名、ゲートID（G01〜G07）、タイムボックスは今回の実験用に設計されたものである。

元の参照資料リンク：

1. [App LEGO README](https://drive.google.com/file/d/1v_5SApJMRTd1MD5fWRG5c60RGCZQPJUq/view)
2. [01 — Idea origins](https://drive.google.com/file/d/1KdQyhC2eOoW-tDlJnkwuBgwUAVhRHFC7/view)
3. [02 — C³ product experience](https://drive.google.com/file/d/1t1d2YSwl_jpyrvNi2GD_27x1Xbsgi8ut/view)
4. [03 — Community hypothesis](https://drive.google.com/file/d/1nXvKDSbgGfTpmM-Ler-p4EVeqo98qa6K/view)
5. [04 — Technical and safety design](https://drive.google.com/file/d/1Xj_VcMFrVJUfwdACxMJbCYxqZHErIx8q/view)
6. [05 — Tests & undecided aspects](https://drive.google.com/file/d/184TEHk48xrqzAp9G6NL8xKMjS4iMtSQn/view)
7. [06 — Market hypothesis](https://drive.google.com/file/d/1aR_vHvgTtkL0hnm4uClfvVD3LxJd7pBl/view)

Google Antigravity ドキュメント（2026-10-30 確認）：

- [Agent skills docs](https://antigravity.google/docs/skills) — ワークスペース `.agents/skills/<name>/SKILL.md`
- [Custom subagents docs](https://antigravity.google/docs/subagents) — ワークスペース `.agents/agents/<name>.md`
- [Official custom agents announcement](https://antigravity.google/blog/introducing-custom-agents) — 2026年8月12日

**プライバシー境界 (Privacy boundary):** 個人の自己分析コーパス（Ishiken Diamond / Interactive Ishiken OS 等）、職歴、家族、財務データは一切含めないこと。モジュール式の探索的インタラクションという抽象的な着想のみを参考にし、デモの登場人物やテキストはすべて架空（フィクション）のものを使用する。

**名称に関する注意 (External naming):** 「LEGO」は第三者の商標であり、`App LEGO` は内部の仮称（Working nickname）である。一般公開するプロダクトとする場合は独自の名称・商標確認が必要となる。
