# PoC 0 — Product specification

## Hypothesis

A toy where software modules can be arranged, connected, disconnected and combined will inspire curiosity **before** users are told to build a useful app. This tests the *composition experience*, not the intelligence of AI code generation or commercial potential.

## Target demonstration (adult tester; no personal data)

- Launch browser. Visually see an inviting toybox and canvas with a clear sample.
- Pick among **Message**, **Character**, **Timer**, **Media Card**. Add them onto a canvas, drag/move, inspect typed ports.
- Wire an output to a compatible input. Valid connection visibly animates or changes content in a deterministic way.
- Press Send on Message block -> connected Character jumps (a short CSS animation).
- Start Timer (3 seconds, reduced to <=3 seconds for demo) -> connected Media Card toggles a mock play state or animates a progress card; **no real media streams**.
- Break a line -> source action no longer updates target.
- Undo -> connection returns, event routing resumes.
- Invalid connection (output→output, unsupported event type, self-loop, or cycle) shows a friendly warning; no edge is added.
- Reset demo returns a reproducible baseline graph; user can freely play again.

## Block contracts (initial)

| Block | Output ports | Input ports | Runtime action |
|---|---|---|---|
| Message | `sent`: `trigger` | none | user clicks send to emit `trigger` |
| Character | optional `jumped`: `notification` (defer unless needed) | `jump`: `trigger` | display a brief jump animation |
| Timer | `elapsed`: `trigger` | none | emit `trigger` when configured countdown ends |
| Media Card | none | `play`: `trigger` | toggle visually mocked play state |

**Keep actual PoC ports minimal:** `Message.sent -> Character.jump`, `Timer.elapsed -> MediaCard.play`. Do not add cross-type connections just to make every combination possible. Future directions can be shown as disabled ideas, not half-built features.

## UX details

- Desktop browser first; responsive single-column fallback for small widths.
- 4 blocks distinguishable by icon, title, outline/color and accessible labels; do not depend solely on color.
- 1–2 click discoverability: preloaded examples plus an empty canvas button.
- Visible event log (“Message.sent -> Character.jump”) to make mechanics understandable.
- Brief animation with reduced-motion handling.
- Undo should cover add/delete/move/connect/disconnect and restore a prior deterministic graph snapshot. If move-history is expensive, document this as a deliberate limitation and prioritize connect/disconnect.
- If no valid drop/connect occurs, show a small nonintrusive hint, not a blocking tutorial.

## Acceptance scenarios

1. Fresh launch: sample graph loads with a Message→Character and Timer→Media pair.
2. Send while connected: character visibly jumps once and log records one dispatch.
3. Remove edge: Send does not change character; event log can record an unhandled event but no target dispatch.
4. Undo disconnection: Send again triggers character.
5. Attempt illegal self-edge / incompatible port: graph remains structurally unchanged, warning appears.
6. Start Timer: one elapsed event after countdown, no duplicate on re-render; cancel when timer block is deleted.
7. Reset restores initial scene; no personal content or network requests.
8. Keyboard focus accessible for basic buttons; page at common laptop width has no clipped primary controls.

## Out of scope

AI generation at runtime, persistent accounts, cloud save, publishing, public collaboration, real messages/video, external services, billing, custom scripting, moderation, mobile native apps. Child use is **not** production-supported; current PoC is an adult-supervised prototype.

## Human research questions

- How many seconds until first spontaneous action?
- Can the tester make the character react without instruction?
- After breaking a line, do they reconnect or try a new combination?
- Is the toy interesting enough to show somebody else?
- What surprise occurred that the designer did not plan?

Do not conflate aesthetic polish, impressive AI coding, and intrinsic fun of module composition.
