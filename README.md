# App LEGO Lab — play with software as blocks

**Status: design + hackathon bootstrap, not an implemented app.** Prepared 2026-10-30 for Antigravity Deep Dive on 2026-10-31.

> Connect. Play. Break. Remix. **First prove that connecting modules is fun.**

This experimental repository is a generic, privacy-safe PoC for composing small app-like blocks. It is **not** a clone of LEGO, LINE, YouTube or any other product. `App LEGO` is a **working nickname**; avoid public product branding until naming/trademark review.

## One-sentence experiment

Can a first-time user place and wire four toy modules, observe an unexpected reaction, disconnect it, and undo the change **without instructions**?

**PoC 0** is strictly offline and deterministic at runtime. Antigravity is used to *build* it, not embedded into the user's prototype. No accounts, cloud storage, external APIs, LLM calls, monetization, live chat, actual video hosting, personal content or production deployment.

## Start here

1. Read [Task Contract](docs/02_TASK_CONTRACT.md) and [Scope & behavior](docs/01_PRD.md).
2. Open this repository as the Antigravity workspace; read [AGENTS.md](AGENTS.md).
3. Paste [first prompt](prompts/00_ANTIGRAVITY_START.md) into the main agent.
4. Run JIDOKA checks from [quality gates](docs/04_JIDOKA_POLICY.md).
5. Observe an actual user and write a result into [`experiments/`](experiments/README.md).

## Project layout

```text
AGENTS.md                   Agent instructions and hard boundaries
.agents/agents/             Antigravity custom workers/inspector
.agents/skills/             Reusable Agent Skills (official workspace path)
docs/01_PRD.md              User experience and acceptance cases
docs/02_TASK_CONTRACT.md    Goal / non-goals / limits / deliverables / done
docs/03_ARCHITECTURE.md     Typed event graph and runtime safety
docs/04_JIDOKA_POLICY.md   Blocking tests, Andon, Poka-yoke
docs/05_RUNBOOK.md         2026-10-31 hackathon plan
docs/06_MODEL_COMPARISON.md Cross-model experiment design
docs/07_PROVENANCE.md       Link to original Google Drive planning docs
prompts/                    First implementation and evaluation prompts
fixtures/                   Privacy-safe sample graph data
src/                        Implementation source (to be generated tomorrow)
tests/                      Test suites (to be generated tomorrow)
experiments/                One reproducible experiment folder per run
artifacts/                  Screenshots, demo videos, reports, builds
```

## Definition of done

- New visitor can add four kinds of blocks, connect compatible output→input ports and see meaningful state changes.
- The demo `Message → Character` makes a character jump; `Timer → Media` makes a media-shaped card react.
- Removing a connection stops the reaction; Undo restores the previous graph and reaction behavior.
- Invalid connections are rejected *without mutating the graph*; cycles/runaway dispatches are bounded.
- Automated tests and build pass; Inspector returns `PASS` with evidence and a human can still say “not fun.”

## GitHub repository and work branches

This repository is hosted at [kentaro-oishi-c3creators/app-lego-lab](https://github.com/kentaro-oishi-c3creators/app-lego-lab) and is intentionally **private** while we validate PoC 0.

For the hackathon, clone/open this repository in Antigravity and create an implementation branch before coding:

```bash
git clone https://github.com/kentaro-oishi-c3creators/app-lego-lab.git
cd app-lego-lab
git switch -c feat/poc0-antigravity
```

Read `AGENTS.md`, the Task Contract and the first prompt. Keep the starter docs and demo code in this repo. Add each run under `experiments/` and evidence under `artifacts/` (screenshots or log files). Do not commit secrets, personal data, paid API keys or private client documents.

**Snapshot/backup:** [C³ Creators Drive — hackathon prep](https://drive.google.com/drive/folders/1EH-GGCGv50Frm-r4aVSZEwbn2SF0LMyh). GitHub is the source of truth for code and history; Drive retains preparation documents and an initial ZIP.

## Important separation

The separate personal 3D self-analysis/diamond project contains personal context; **do not copy that content here**. Use synthetic text, fictional people, original icons only. A hackathon demo or GitHub repo may be shared publicly later: review sample data and screenshots before sharing.

**C³ Creators** is a project context, not a statement of commercial product availability.
