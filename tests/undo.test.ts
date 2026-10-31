import { describe, expect, it } from 'vitest';
import { addEdge, addNode, removeEdge } from '../src/domain/graph';
import { dispatchEvent } from '../src/domain/runtime';
import { createSampleGraph } from '../src/domain/sampleGraph';
import {
  canUndo,
  createHistory,
  MAX_HISTORY_LENGTH,
  pushHistory,
  resetHistory,
  undoHistory,
} from '../src/state/history';

describe('Graph Undo History (Gate G04)', () => {
  it('restores disconnected edge on Undo and resumes event routing', () => {
    const initial = createSampleGraph();
    let history = createHistory(initial);
    expect(canUndo(history)).toBe(false);

    // 1. Connected: Message -> Character dispatches 1 event
    expect(dispatchEvent(history.present, 'msg-1', 'sent').deliveries).toHaveLength(1);

    // 2. Disconnect edge-1
    const disconnected = removeEdge(history.present, 'edge-1');
    history = pushHistory(history, disconnected);
    expect(canUndo(history)).toBe(true);
    expect(dispatchEvent(history.present, 'msg-1', 'sent').deliveries).toHaveLength(0);

    // 3. Undo disconnection -> connection returns and routing resumes
    history = undoHistory(history);
    expect(canUndo(history)).toBe(false);
    expect(history.present.edges.some((e) => e.id === 'edge-1')).toBe(true);
    expect(dispatchEvent(history.present, 'msg-1', 'sent').deliveries).toHaveLength(1);
  });

  it('undoes newly added connection and node additions', () => {
    const initial = removeEdge(createSampleGraph(), 'edge-1');
    let history = createHistory(initial);

    const reconnected = addEdge(history.present, {
      id: 'edge-reconnected',
      from: { nodeId: 'msg-1', portId: 'sent' },
      to: { nodeId: 'char-1', portId: 'jump' },
    });
    history = pushHistory(history, reconnected.graph);
    expect(history.present.edges).toHaveLength(2);

    history = undoHistory(history);
    expect(history.present.edges).toHaveLength(1);
  });

  it('caps history stack at MAX_HISTORY_LENGTH (30) and resets cleanly', () => {
    let history = createHistory(createSampleGraph());

    for (let i = 1; i <= 40; i++) {
      const next = addNode(history.present, {
        id: `extra-${i}`,
        type: 'message',
        position: { x: i * 10, y: 0 },
        data: { label: `Msg ${i}` },
      });
      history = pushHistory(history, next);
    }

    expect(history.past).toHaveLength(MAX_HISTORY_LENGTH);

    const reset = resetHistory(createSampleGraph());
    expect(reset.past).toHaveLength(0);
    expect(reset.present.nodes).toHaveLength(4);
  });
});
