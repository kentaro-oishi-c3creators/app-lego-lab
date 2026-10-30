# Workspace instructions for coding agents

This workspace is App LEGO **PoC 0 only**. The project must be useful with zero model/API usage at runtime.

## Source of truth and sequence

1. `docs/02_TASK_CONTRACT.md` controls scope and completion.
2. `docs/01_PRD.md` controls visible behavior.
3. `docs/03_ARCHITECTURE.md` controls event graph and data format.
4. `docs/04_JIDOKA_POLICY.md` controls blocking checks.
5. Keep originals in `docs/07_PROVENANCE.md` as source pointers, not as an excuse to expand scope.

## Operating rules

- Use React + TypeScript + Vite. Use a maintained graph/canvas library when it saves time. Prefer pure functions for event graph validation/dispatch and unit-test those functions separately.
- Users may compose predefined safe module types: message, character, timer, media-card. Absolutely no arbitrary JS eval, shell execution, external app integrations, uploads, identity/accounts, or user-generated executable code.
- Never fake a successful build, browser test, or visual test. Report commands, actual outputs and gaps.
- Avoid dependency sprawl. Initial scope is deliberately small. Ask for approval before changing scope or spending money.
- Never publish, deploy, email, access unrelated files, or connect a paid external API without explicit confirmation.
- Never ingest personal self-analysis or sensitive company/client data; use fictional fixture content.
- Event graph MUST reject incompatible ports before insertion; runtime dispatch MUST be cycle-safe via visited-event dedup and max-step bound. Display a friendly error and keep the graph unchanged on invalid action.
- One blocking failure means `STATUS: BLOCKED`. A reviewer must decide whether to proceed after tests are fixed.
- Inspector may audit/test but must not silently change production code. Coordinator owns integration.

## Collaboration

If supported, delegate graph/runtime and UI/block rendering separately, preferably on separate branches/worktrees, and integrate in stages. Custom workers are defined in `.agents/agents/`. If subagent support differs by client/version, execute roles sequentially without claiming concurrent execution.

## Final response from an agent

Include: implemented scope; changed files; commands/tests with PASS/FAIL; unverified items; JIDOKA decision; artifacts; exact next experiment. Never claim that human enjoyment is proven by automated tests.
