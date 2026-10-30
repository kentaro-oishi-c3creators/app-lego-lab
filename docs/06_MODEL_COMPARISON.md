# Cross-model / cross-agent experiment plan

## Purpose

Compare *tool + model + task execution* on the same narrowly scoped PoC, not the intrinsic intelligence of a model. Different agents may have different default tools, prompts, caches, context, timeouts and permissions; claims must be qualified.

## Controlled inputs

- Same baseline commit SHA in the repository, fresh branch/worktree for each run.
- Same `docs/02_TASK_CONTRACT.md`, requirements, fixtures and primary prompt; record any provider-specific adjustment.
- Same timebox and test commands on same machine if possible.
- Same external package policy, network approval rules and budget cap.
- No prior hidden context from a previous agent run where possible; log known exceptions.

## Candidate naming (examples only)

- `antigravity-argon-YYYYMMDD`
- `claude-opus-YYYYMMDD`
- `other-model-YYYYMMDD`

Specific model versions, availability and price must be rechecked at test time. Do not assume every named model runs inside the same harness. Distinguish **model** from **agent harness**.

## Comparison dimensions

| Dimension | Operational measure |
|---|---|
| Completion | G01–G07, features implemented |
| Correctness | Tests, edge-case coverage |
| Safety | blocked actions, data access, unauthorized external calls |
| Iterations | number of repair cycles, regressions |
| Cost | paid plan/API fees where known, token/tool use if available |
| Time | wall clock and human intervention minutes |
| UX | independent human behavior measures from Runbook |
| Reproducibility | baseline SHA, tool/model versions, commands |

## Recording

Copy `experiments/_TEMPLATE.md` to `experiments/YYYYMMDD_run-name/README.md`; store non-sensitive logs, test results, screenshots, video links and generated files under that directory (or `artifacts/` and link to them). Keep a dated table of runs; never overwrite prior evidence.

## Fairness caveat

An equal prompt does not guarantee a fair task if model capabilities and tool connections differ. The useful question is “which complete workflow delivers what quality under these constraints?”, not “which brand is objectively best?”.
