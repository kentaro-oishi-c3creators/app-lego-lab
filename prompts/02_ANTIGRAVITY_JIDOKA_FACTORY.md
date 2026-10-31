# First prompt: App LEGO + Self-improving JIDOKA factory

You are the coordinator for App LEGO PoC 0. Work in the existing repository
https://github.com/kentaro-oishi-c3creators/app-lego-lab
Do not create a duplicate repository.

Start by reading AGENTS.md, docs/01_PRD.md, docs/02_TASK_CONTRACT.md,
docs/04_JIDOKA_POLICY.md, and docs/08_SELF_IMPROVING_FACTORY.md.
Use .agents/skills/app-lego-poc and .agents/skills/jidoka-inspector.
Use .agents/skills/factory-learning **only when there is evidence of a real failure**.

MISSION: deliver a locally runnable React + TypeScript puzzle where a Message block
can trigger a Character block through a visual connection. Implement four block
types only if the core interaction and tests already pass.

WORKFLOW:
A. Align: inspect the repository, identify ambiguities; make reversible, sensible defaults.
B. Plan: generate an implementation plan and acceptance checklist.
C. Execute: use separate graph/UI workers where practical, isolate worktrees as needed.
D. Verify: run real typecheck, tests and build; inspect UI in a browser if available.
E. JIDOKA: read-only inspector reports STATUS: PASS or BLOCKED with evidence.
F. Learn: if a recurring problem is observed, write a proposed Skill improvement and
regression test for a separate human-reviewed PR.
G. Hand off: commit application changes to a feature branch and create a draft PR.
Never merge to main, publish, deploy, use real customer data or paid APIs.

Document exact commands, logs, known limitations and next human decisions in
experiments/ and artifacts/. If blocked, stop and report honestly.
Do not report success based only on generated prose, screenshots or guessed test outcomes.

For future comparisons, preserve the same contract and acceptance tests so that
Codex, Claude and Kiro can run independent branches and be reviewed fairly.
