# Cross-tool review: Antigravity / Codex / Claude / Kiro

## Shared contract
All tools must read root AGENTS.md, docs/02_TASK_CONTRACT.md,
docs/04_JIDOKA_POLICY.md and docs/08_SELF_IMPROVING_FACTORY.md.

## Suggested branches
- feat/poc0-antigravity — primary implementation
- review/poc0-codex — independent code/test review
- review/poc0-claude — architecture, UX and edge-case review
- review/poc0-kiro — requirements/design/tasks traceability
- chore/skills-<issue> — proposed factory improvements (human-reviewed)

## Review checklist
1. Does behavior meet the original task contract?
2. Are type safety, event bounds, undo and invalid edge rejection tested?
3. Are observed test results real rather than reported as if executed?
4. Does the Browser Subagent evidence match the implementation?
5. Were safety gates bypassed or weakened?
6. Does the change preserve offline, local, no-PII assumptions?
7. Which suggested Skill enhancements have concrete failure evidence?

Deliver independent markdown reviews under experiments/<run>/; use PR comments for
specific findings. Never auto-merge or trigger unreviewed production deployment.

## Comparing agents
Capture model ID/version, harness, prompt hash, exact contract revision, test output,
duration, human intervention count, major defects, and estimated cost.
Do not compare tools as though they used the same model if the underlying models differ.
