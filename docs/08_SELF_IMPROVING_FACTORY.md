# Self-improving App LEGO Factory

## Principle
Treat implementation, verification and process improvement as separate steps. The factory learns by proposing version-controlled changes, **not** by silently rewriting its own safety constraints.

## Execution loop
1. Read AGENTS.md, docs/02_TASK_CONTRACT.md and docs/04_JIDOKA_POLICY.md.
2. Implement the smallest working product behavior on a feature branch.
3. Run deterministic gates first: typecheck, unit tests, production build, security/secret scan, graph bounds checks.
4. Run read-only JIDOKA Inspector; produce PASS/BLOCKED plus evidence, exact commands, output summaries and residual risk.
5. If BLOCKED, stop publishing/merging. Fix product defect on the implementation branch and re-run checks.
6. Use /learn (when supported) or the improvement template to analyze recurring errors.
7. Propose a **separate** improvement PR for Skills, agent instructions or check scripts. Include baseline, repro, new regression check and proposed text diffs.
8. Human reviews/approves workflow/skill changes; never self-approve or weaken a gate to make checks green.

## Safety invariants
- No force pushes, direct main commits, automatic merges, production deployments, paid API calls or secret upload.
- No personal/financial/client data in fixtures, logs, screenshots or AI prompts.
- Workers can propose rule improvements; inspectors must not modify the code they audit.
- Cannot change docs/04_JIDOKA_POLICY.md, this policy, branch protections or CI security checks without human approval.
- A model's PASS is advisory; deterministic tests are authoritative for their stated coverage.
- Unverified browser/UX outcomes remain explicitly unverified.

## Observation and evolution
Store records in experiments/<YYYYMMDD>-<model>-<run>/:
- context.md — model, harness, permissions, task, versions, elapsed time;
- jidoka-report.md — gates, PASS/BLOCKED, log references;
- failures.md — reproduction and root cause hypotheses;
- learn-proposal.md — proposed Skill/Rule changes, target tests;
- human-review.md — acceptance, rejection or deferred judgement.

## Model portability
The root AGENTS.md and docs/* are canonical across Antigravity, Codex, Claude and Kiro.
Keep platform-specific adapters minimal; do not duplicate policy text into divergent configuration files.
Use equivalent roles: coordinator, graph worker, UI worker, read-only inspector.
Record which tool/harness actually executed each gate.
