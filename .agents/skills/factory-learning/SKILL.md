---
name: factory-learning
description: Analyze repeated implementation failures and propose auditable improvements to App LEGO Skills, agents, and tests. Never auto-approve or weaken quality gates.
---
# Factory Learning / POKA-YOKE

Trigger after an actual JIDOKA failure or an explicit human request to improve the factory.

1. Read docs/08_SELF_IMPROVING_FACTORY.md and docs/04_JIDOKA_POLICY.md.
2. Collect factual evidence: failing command, logs, reproduction, impacted component and prior failure history.
3. Classify: product code bug, test weakness, instruction ambiguity, tool/harness failure or environmental problem.
4. Produce experiments/<run>/learn-proposal.md with:
   - symptom and reproducible evidence;
   - likely cause and uncertainties;
   - proposed change to a Skill or agent definition;
   - regression test / measurable acceptance criterion;
   - risk that the proposal hides failures;
   - rollback plan.
5. Keep learning changes on a separate branch and PR from application changes.
6. Request human review before merging; never bypass tests or silently edit safeguards.

Successful completion means an evidence-based proposal is ready for review, **not** that the factory has autonomously improved.
