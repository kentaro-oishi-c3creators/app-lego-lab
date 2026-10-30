# Task Contract — App LEGO PoC 0

**Date:** 2026-10-31 JST. **Max build window:** approx. 4 hours after morning session (may be shorter). **Owner:** human participant.

## Goal

Implement a local interactive software-block puzzle in which placing, connecting, disconnecting and undoing connections *changes behavior*, enabling one honest human observation of whether this is enjoyable.

## Non-goals

- Do not build a full app generator, chat service, video platform or social network.
- Do not use the user's self-analysis corpus or any personally identifiable / client / financial / private Drive content.
- Do not implement LLM use at runtime or an agent framework inside the user-facing demo.
- Do not deploy or publish automatically; do not request paid APIs.
- Do not add more than four block types, marketplace, auth, accounts, multiuser, payments, cloud DB, real uploads.

## Constraints

- React + TypeScript + Vite, local-only; TypeScript strict on.
- Runtime deterministic and offline; use minimal dependencies.
- Typed ports; validate graph edits before commit and bound event dispatch.
- Fast first interaction; accessible labels, reduced motion support.
- Testable pure graph/event utilities; no code execution from block labels/data; no `eval`.
- Treat `AGENTS.md` and `docs/04_JIDOKA_POLICY.md` as binding rules.
- No side effects outside repo without approval. If git operations are available, commit only to a feature branch and request review before any main/public push.

## Deliverables

1. Working local Web PoC with 4 modules, 2 meaningful behaviors and sample graph.
2. `npm install`, `npm run dev`, `npm run build`, `npm test` documented and working (adapt scripts to actual stack).
3. Automated unit tests for valid/invalid connections, undo and bounded routing.
4. Browser-based evidence or explicit notice if browser verification cannot be run.
5. README with demo steps and limitations; `artifacts/` demo screenshots/recording (if captured), `experiments/` observation log.
6. JIDOKA report with either `STATUS: PASS` or `STATUS: BLOCKED` plus failed checks.

## Done when

- Sample demo interactions run reliably with no console errors and no network requirement (besides local dev serving).
- Typecheck, test and production build pass, with test outputs recorded.
- Bad edges are rejected, graph remains unchanged, dispatch safety bound is tested.
- Undo works after at least disconnect and connect.
- Main agent presents a human-ready demo and records unverified UX observations separately.
- Timebox ends or human says stop: clearly report incomplete work rather than expanding scope.

**Stop conditions:** Any secret/personal data at risk, any unauthorized external side-effect, runaway event loop, security issue or tests failing -> `STATUS: BLOCKED`; do not publish.
