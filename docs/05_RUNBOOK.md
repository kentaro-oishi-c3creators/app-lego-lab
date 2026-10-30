# Hackathon runbook — 2026-10-31 JST

The event's morning lecture is planned before the afternoon build. Live schedule may change. The times below are a suggested personal timebox, not the organizer's official program.

| Slot | Main outcome | Stop/Go |
|---|---|---|
| Before build (15 min) | Clone repo, read Task Contract, start Antigravity, decide implementation mode | No secrets, no unapproved commands |
| Phase A (45–60 min) | Minimal Vite app + graph core + first Message→Character reaction | Must be genuinely interactive |
| Phase B (45–60 min) | Canvas wiring/disconnect + Undo, graph tests | Invalid connections rejected |
| Phase C (30–45 min) | Timer→Media mock, nice interactions, inspect accessibility | Stop adding scope |
| Phase D (30–45 min) | JIDOKA Inspector: typecheck/test/build/browser, fix or BLOCK | Evidence + report |
| Final (20–30 min) | 60–90 sec demo, README, screenshot, run record | Human observation + next step |

## Demo storyboard

1. Show toybox, drag Message and Character to canvas.
2. Connect `sent → jump`; send message; character jumps.
3. Disconnect; send; no jump. Undo; send; jump returns.
4. Add Timer & Media Card, connect them; timer fires; fake media reaction.
5. Try an invalid connection; app refuses gracefully.
6. End with a question: “Is connecting these parts enjoyable, even without AI magic?”

## Observation form

- Start time, device/browser, experiment ID
- Seconds to first voluntary interaction
- Number of distinct connection ideas attempted
- Number of recovery/retry actions after failure
- Did participant ask to continue or remix?
- Most surprising behavior / confusion
- What to remove next time?
- Verdict: interesting / uncertain / not interesting (avoid forced positivity)

## If time is running out

Ship only Message→Character + disconnect + undo + tests. It is better to demonstrate **one real composition** than show four beautiful inert cards.

## Event day rules

- Use online attendance as planned. Do not assume remote hackers can present to the main event audience; check the live instructions.
- If screen sharing, confirm no private browser tabs, Drive docs or tokens are visible.
- Do not push private business files or personal observations to a public repo.
