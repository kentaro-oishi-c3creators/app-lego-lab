import { describe, expect, it } from 'vitest';
import { removeEdge } from '../src/domain/graph';
import {
  DEFAULT_MAX_DELIVERIES,
  DEFAULT_MAX_HOPS,
  dispatchEvent,
} from '../src/domain/runtime';
import { createSampleGraph } from '../src/domain/sampleGraph';
import { BlockEdge, BlockNode, GraphState } from '../src/domain/types';

describe('Bounded Event Dispatcher (Gate G03)', () => {
  it('dispatches Message.sent -> Character.jump deterministically once', () => {
    const graph = createSampleGraph();
    const res = dispatchEvent(graph, 'msg-1', 'sent', undefined, 1700000000000);

    expect(res.unhandled).toBe(false);
    expect(res.stoppedByCycle).toBe(false);
    expect(res.truncatedByLimit).toBe(false);
    expect(res.deliveries).toHaveLength(1);
    expect(res.deliveries[0]).toMatchObject({
      edgeId: 'edge-1',
      sourceNodeId: 'msg-1',
      sourcePortId: 'sent',
      targetNodeId: 'char-1',
      targetPortId: 'jump',
      targetBlockType: 'character',
      hop: 1,
    });
  });

  it('produces zero deliveries and marks unhandled when edge is removed', () => {
    const graph = removeEdge(createSampleGraph(), 'edge-1');
    const res = dispatchEvent(graph, 'msg-1', 'sent', undefined, 1700000000000);

    expect(res.deliveries).toHaveLength(0);
    expect(res.unhandled).toBe(true);
  });

  it('terminates safely on a forged cyclic graph via visited-edge deduplication', () => {
    const forgedCycleGraph: GraphState = {
      schemaVersion: 1,
      name: 'Forged 2-node cycle',
      nodes: [
        { id: 'n1', type: 'message', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'character', position: { x: 100, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', from: { nodeId: 'n1', portId: 'sent' }, to: { nodeId: 'n2', portId: 'jump' } },
        { id: 'e2', from: { nodeId: 'n2', portId: 'jumped' }, to: { nodeId: 'n1', portId: 'sent' } },
      ],
    };

    const res = dispatchEvent(forgedCycleGraph, 'n1', 'sent');
    expect(res.stoppedByCycle).toBe(true);
    expect(res.deliveries.length).toBeLessThanOrEqual(DEFAULT_MAX_DELIVERIES);
    expect(res.deliveries).toHaveLength(2);
  });

  it('enforces maxHops=8 on a forged deep chain graph', () => {
    const nodes: BlockNode[] = [];
    const edges: BlockEdge[] = [];
    for (let i = 0; i <= 12; i++) {
      nodes.push({
        id: `n-${i}`,
        type: i === 0 ? 'message' : 'character',
        position: { x: i * 50, y: 0 },
        data: {},
      });
      if (i > 0) {
        edges.push({
          id: `e-${i}`,
          from: { nodeId: `n-${i - 1}`, portId: i === 1 ? 'sent' : 'jumped' },
          to: { nodeId: `n-${i}`, portId: 'jump' },
        });
      }
    }

    const deepGraph: GraphState = {
      schemaVersion: 1,
      name: 'Forged 12-hop chain',
      nodes,
      edges,
    };

    const res = dispatchEvent(deepGraph, 'n-0', 'sent');
    expect(res.truncatedByLimit).toBe(true);
    expect(res.limitReason).toBe('MAX_HOPS');
    expect(res.deliveries).toHaveLength(DEFAULT_MAX_HOPS);
    expect(Math.max(...res.deliveries.map((d) => d.hop))).toBeLessThanOrEqual(DEFAULT_MAX_HOPS);
  });

  it('enforces maxDeliveries=32 on a forged high-fanout cyclic graph', () => {
    const nodes: BlockNode[] = [
      { id: 'origin', type: 'message', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges: BlockEdge[] = [];

    // Create 45 target nodes and parallel/cyclic edges to exceed 32 deliveries
    for (let i = 1; i <= 45; i++) {
      nodes.push({
        id: `target-${i}`,
        type: 'character',
        position: { x: 100, y: i * 20 },
        data: {},
      });
      edges.push({
        id: `fanout-${i}`,
        from: { nodeId: 'origin', portId: 'sent' },
        to: { nodeId: `target-${i}`, portId: 'jump' },
      });
      // Forged back-edge to origin
      edges.push({
        id: `back-${i}`,
        from: { nodeId: `target-${i}`, portId: 'jumped' },
        to: { nodeId: 'origin', portId: 'sent' },
      });
    }

    const forgedFanoutGraph: GraphState = {
      schemaVersion: 1,
      name: 'Forged fanout cycle',
      nodes,
      edges,
    };

    const res = dispatchEvent(forgedFanoutGraph, 'origin', 'sent');
    expect(res.truncatedByLimit).toBe(true);
    expect(res.limitReason).toBe('MAX_DELIVERIES');
    expect(res.deliveries).toHaveLength(DEFAULT_MAX_DELIVERIES);
  });
});
