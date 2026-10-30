# Technical architecture — tiny typed event-graph toy

## Layers

```text
Browser Canvas (React + React Flow or equivalent)
  ├─ Palette / Nodes / Edges / Undo UI
  ├─ Runtime block views / animations
  └─ Event Log / Feedback
                  ↓ actions
Graph state + history (typed JSON, pure updates)
  ├─ `validateConnection(graph, proposedEdge)` (pure)
  └─ `dispatchEvent(graph, sourcePort, payload, limits)` (bounded and pure plan)
                  ↓ effects
UI event dispatcher / state machine
  └─ Presentation state: jump/play/progress; no arbitrary code execution
```

## Data contracts

- `BlockType`: `message` | `character` | `timer` | `media-card`.
- `BlockNode`: `{ id, type, position: {x,y}, data: {label?, durationSeconds?} }` with a *whitelisted* field set.
- `BlockEdge`: `{ id, from: {nodeId,portId}, to: {nodeId,portId} }`.
- `PortType`: `trigger` in PoC 0; `notification` is reserved only as future design and should not be implemented now.
- A connection exists only from output port to input port; both nodes must exist and port signatures must match. Disallow direct self-loop, duplicate edge and graph cycle.
- `GraphState` is the single source of truth for layout and edges; UI transient animation state stays separate.
- Every valid event is `{eventId,sourceNodeId,sourcePortId,type,createdAt,traceId}`. IDs generated locally.

## Deterministic runtime

1. User clicks Send (or timer fires).
2. Dispatcher creates a `trigger` event at the source output.
3. Lookup directed graph edges; deliver only to compatible input ports.
4. Invoke a predefined `onEvent` handler for each destination block type.
5. Record dispatched target(s) for UI and event log.
6. Enforce dispatch `maxHops=8`, `maxDeliveries=32` per origin event, and visited edge/event dedup as defense in depth.

Why both cycle rejection and dispatch bound? An invalid graph may arrive through corrupted fixture/load or future feature. The runtime must **also** fail safe. Never allow arbitrary node code or user-provided event handlers.

## Undo design

Use snapshot stack or patches for graph-changing actions. Basic cap e.g. last 30 graph states. Edges added/removed, blocks created/deleted, movement (if manageable). Avoid storing transient animation state in history.

## Component boundary

| Component | Responsibility | Should not do |
|---|---|---|
| GraphEngine | validate edges, modify graph state, bound route | DOM, useEffect, timers, network |
| BlockKit | render four toy modules; typed ports | mutate global graph directly |
| Canvas | drag, connect, select, remove | infer event semantics from UI labels |
| RuntimeDriver | timer cancellation, trigger effects, log | execute arbitrary strings as code |
| Inspector | tests, reports, STOP/GO | silently patch without approval |

## Minimal project target

```text
src/
  app/App.tsx
  domain/types.ts
  domain/graph.ts
  domain/runtime.ts
  components/Canvas.tsx
  components/blocks/{Message,Character,Timer,MediaCard}.tsx
  state/history.ts
  styles.css
tests/{graph,dispatch,undo}.test.ts
```

File names are examples, not hard requirements. Prefer correct boundaries over perfect architecture.

## Development sequence

1. `Message.sent -> Character.jump` with click behavior and tests.
2. Disconnect/reconnect + Undo; verify.
3. Timer + Media Card mock behavior; verify timer cleanup.
4. Canvas palette and polish only after working interactions.

Do not build a real video player. CSS mock visual is enough to test the idea.
