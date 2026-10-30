# JIDOKA quality gates — STOP defective output

**Principle:** Do not continue integration or publish when critical correctness/safety tests fail. This is a deliberate adaptation of manufacturing JIDOKA/ANDON/POKA-YOKE concepts for a small code PoC.

## Levels

- `PASS`: blocking tests pass and required interactions demonstrated. Human still decides whether toy is fun.
- `BLOCKED`: any blocking test fails or required evidence is missing. Display **ANDON** with concise actionable issue and stop further integration/deployment.
- `WARN`: non-blocking UX polish or optional checks; document limits. Never convert an untested behavior to PASS.

## Blocking gates

| ID | Gate | Evidence |
|---|---|---|
| G01 | `npm run build` + TypeScript typecheck pass | stdout / CI |
| G02 | unit tests for legal & illegal connection, duplicate, self-loop, cycle | test report |
| G03 | event dispatch is bounded with forged cyclic graph | test report |
| G04 | connection remove -> no effect; undo -> effect restored | browser check or integration test |
| G05 | timer fires once, cleans up on unmount / delete | test and/or browser check |
| G06 | no `eval`, dynamic code, unapproved network, tokens, PII in repo | static review |
| G07 | no primary UI controls clipped on normal desktop | visual check or explicit UNVERIFIED |

## ANDON incident example

```text
STATUS: BLOCKED
Gate: G03
Observed: malformed graph triggered >32 deliveries
Expected: maxDeliveries <= 32 and controlled error
Repro: npm test -- --run dispatch
Owner: Graph Engine Worker
Action: fix queue/visited dedup, add regression test, rerun G01-G07
No publish/integration until fixed.
```

## POKA-YOKE (prevent recurrence)

For each real defect: (1) reproduce in a test; (2) fix root cause; (3) add or strengthen rule in a relevant SKILL.md / test fixture **only if generalized and justified**; (4) record short note in `experiments/`; (5) rerun gates. Do not rewrite Skills merely to create the appearance of learning.

## Duties

- UI and Graph Workers add the tests they can validate.
- Inspector independently checks and reports using `STATUS` plus gate IDs. Inspector **must not** mutate production code.
- Coordinator approves fix, assigns owner, reruns tests and logs final status.
- Human evaluates delight / curiosity / usability. Machine passing tests is necessary, not sufficient.

## Failure timebox

If any gate takes >30 minutes to resolve, shrink feature scope or preserve `BLOCKED` status for human review. Never disable a blocking test to make a demo pass.
