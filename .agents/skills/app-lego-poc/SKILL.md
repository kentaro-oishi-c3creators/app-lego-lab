---
name: app-lego-poc
description: Implements and tests small local interactive toy block applications for the App LEGO PoC0 hackathon, with typed event connections, undo and no runtime AI.
---

# App LEGO PoC0 skill

Use this skill when the task asks to implement a block/module, event graph, connection or Undo feature in this project.

1. Read `docs/02_TASK_CONTRACT.md`, then `docs/03_ARCHITECTURE.md` and the specific acceptance case from `docs/01_PRD.md`.
2. Confirm you are in the App LEGO workspace and have not imported private data or expanded scope.
3. Implement the smallest testable increment; prefer pure domain functions before UI side effects.
4. Write tests for normal, invalid and recovery paths. Run available typecheck/tests after each increment.
5. Preserve the `Message→Character` demo at all times. If it breaks, raise an Andon and stop feature expansion.
6. Hand off to `jidoka-inspector` skill or custom inspector agent before declaring complete.
7. Update `experiments/` with what was actually observed. Never claim human delight from automated checks.

Possible subtask sequence: Graph Engine → UI Blocks → integration → JIDOKA → human observation. Use separate worktrees when safely supported; do not assume subagent concurrency.
