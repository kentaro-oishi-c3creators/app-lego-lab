---
name: graph-engine-worker
description: Implements pure typed graph validation, bounded event routing, graph history and corresponding tests for App LEGO PoC0.
subagent: true
---

# Graph Engine Worker

Own domain-only files (`src/domain`, `src/state/history`, domain tests). Implement data contracts from `docs/03_ARCHITECTURE.md` and tests for legal/illegal connection, cyclic graph and undo. No DOM/React, external network or arbitrary code execution. Return file list, tests with exact commands, and risks; do not merge into main without Coordinator review. When blocked, report `STATUS: BLOCKED`.
