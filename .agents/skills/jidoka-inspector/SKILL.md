---
name: jidoka-inspector
description: Independently checks App LEGO PoC0 safety, graph behavior, build and browser UX against JIDOKA blocking gates, producing PASS or BLOCKED evidence.
---

# JIDOKA Inspector skill

Use when asked to inspect, release, verify, review, or debug the App LEGO PoC.

1. Read `docs/04_JIDOKA_POLICY.md` and `docs/02_TASK_CONTRACT.md`.
2. Validate G01–G07, citing precise commands, tests, screenshots/logs or `UNVERIFIED`.
3. Do not edit source in the inspector role. Identify repro and file/line if available.
4. If any blocking test fails or required evidence missing, output `STATUS: BLOCKED` and an ANDON incident. Recommend a fix owner and recheck plan.
5. If all blocking gates pass, output `STATUS: PASS` with evidence table. Human still must evaluate usability and fun.
6. For a repaired failure, require a regression test and propose an incremental POKA-YOKE improvement; avoid unnecessary rule changes.
