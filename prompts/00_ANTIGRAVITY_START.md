# First prompt to paste into Google Antigravity

You are the coordinator for a 2026-10-31 hackathon PoC named **App LEGO Lab**. The files in this repo are specifications and work instructions; the web app has NOT been implemented yet.

**First read**, in order: `AGENTS.md`, `docs/02_TASK_CONTRACT.md`, `docs/01_PRD.md`, `docs/03_ARCHITECTURE.md`, and `docs/04_JIDOKA_POLICY.md`. Inspect `.agents/skills` and `.agents/agents`. Do not start by imagining a larger product.

**Objective:** In a local React+TypeScript+Vite browser app, make four preset toy blocks (Message, Character, Timer, Media Card) connect with type-safe event ports. The essential proof is: Message.send -> Character.jump; Timer.elapsed -> MediaCard.mockPlay; detach a connection and the effect stops; Undo restores it. Invalid edges are rejected, bounded dispatch prevents runaway event loops. This must be *real interactive behavior*, not just a pretty diagram.

**Strict constraints:** PoC0 only. No runtime LLM calls. No real chat/video service, no cloud auth, no private data, no paid APIs, no automatic public deployment, no shell permission bypass or arbitrary code execution. Do not modify unrelated files. Use synthetic labels and a deterministic demo fixture.

**Method:**
1. Summarize the Task Contract in 6 lines, then show a minimal implementation plan and 3–4 objective STOP/GO checkpoints. Avoid unnecessary questions; use specified defaults.
2. Bootstrap Vite React TypeScript app with minimal canvas library and Vitest if useful. Prioritize pure graph validator / bounded dispatcher and unit tests.
3. If supported, delegate `graph-engine-worker` and `ui-play-worker` on isolated worktrees / nonoverlapping paths; otherwise sequentially perform those roles. The coordinator integrates and fixes interface mismatches. Do not claim parallel work if it did not happen.
4. Make `Message → Character` work before adding any sophistication. Add Undo, then Timer → Media Card. Include readable UI and accessible interactions.
5. Run the `jidoka-inspector` skill / inspector agent. If any blocking gate is red, stop, emit a clear `STATUS: BLOCKED` ANDON, assign a fix, add regression tests, rerun. The inspector must not silently modify production files.
6. On success, collect actual commands/results, one screenshot or browser-observation report, demo instructions, and one run log under `experiments/20261031_antigravity/` with `artifacts/` pointers.
7. Finish by asking me to **play with it** and report whether the composition feels fun. Automated tests cannot decide that.

**Quality bar:** Typecheck/build/test must genuinely pass, invalid port connection must not mutate state, and `Message → Character → disconnect → Undo` must have an observable end-to-end demonstration.

**Timebox:** Approx. afternoon, ~3–4 hours total. If time is insufficient, deliver ONLY `Message → Character`, disconnect and Undo, fully tested, instead of a polished but inert prototype.

**Avoid external side effects:** Do not commit to main, publish, deploy or install paid services without checking with me. I want a reviewable local implementation first.
