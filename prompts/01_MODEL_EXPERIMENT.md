# Repeatable model comparison prompt

Reproduce App LEGO PoC0 starting from the specified clean baseline SHA and a fresh branch. Read `AGENTS.md`, the Task Contract and JIDOKA policy. You must not inspect another model run's outputs until your run is complete (if practical).

Record in a new `experiments/YYYYMMDD_<tool-model>/README.md`:

- tool/harness name and version;
- model exact ID/version (if visible), tier, and settings;
- baseline SHA and prompt diff (if any);
- dependencies, platform, commands, elapsed time and human interventions;
- pass/fail for each JIDOKA gate with evidence;
- features working vs not working;
- costs only if reliably known, otherwise UNKNOWN;
- screenshots or test logs without private data;
- human UX observation, separately from objective correctness.

Do not claim this evaluates models independent of their harness. Do not fake equal conditions if access or tools vary.
