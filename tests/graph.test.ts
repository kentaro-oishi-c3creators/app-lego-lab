import { describe, expect, it } from 'vitest';
import {
  addEdge,
  addNode,
  moveNode,
  removeEdge,
  removeNode,
  sanitizeGraph,
  transformKotodama,
  validateConnection,
} from '../src/domain/graph';
import {
  createEmptyGraph,
  createKarakuriChainGraph,
  createSampleGraph,
  createSenbonzakuraGraph,
  createTaikoComboGraph,
  decodeGraphFromHash,
  encodeGraphToHash,
} from '../src/domain/sampleGraph';
import { GraphState } from '../src/domain/types';

describe('Graph Engine — Connection Validation & Immutability (Gate G02)', () => {
  it('loads sanitized sample graph with Message->Character and Timer->MediaCard pairs', () => {
    const sample = createSampleGraph();
    expect(sample.nodes).toHaveLength(4);
    expect(sample.edges).toHaveLength(2);
    expect(sample.edges[0].from).toEqual({ nodeId: 'msg-1', portId: 'sent' });
    expect(sample.edges[0].to).toEqual({ nodeId: 'char-1', portId: 'jump' });
    expect(sample.edges[1].from).toEqual({ nodeId: 'timer-1', portId: 'elapsed' });
    expect(sample.edges[1].to).toEqual({ nodeId: 'media-1', portId: 'play' });
  });

  it('allows valid connections (Message.sent -> Character.jump and Timer.elapsed -> MediaCard.play)', () => {
    const base: GraphState = {
      ...createSampleGraph(),
      edges: [],
    };

    const res1 = addEdge(base, {
      from: { nodeId: 'msg-1', portId: 'sent' },
      to: { nodeId: 'char-1', portId: 'jump' },
    });
    expect(res1.validation.valid).toBe(true);
    expect(res1.graph.edges).toHaveLength(1);
    expect(base.edges).toHaveLength(0); // Immutability check

    const res2 = addEdge(res1.graph, {
      from: { nodeId: 'timer-1', portId: 'elapsed' },
      to: { nodeId: 'media-1', portId: 'play' },
    });
    expect(res2.validation.valid).toBe(true);
    expect(res2.graph.edges).toHaveLength(2);
  });

  it('rejects self-loop without mutating graph', () => {
    const graph: GraphState = {
      ...createSampleGraph(),
      edges: [],
    };
    const snapshot = JSON.stringify(graph);

    const res = addEdge(graph, {
      from: { nodeId: 'char-1', portId: 'jumped' },
      to: { nodeId: 'char-1', portId: 'jump' },
    });

    expect(res.validation.valid).toBe(false);
    expect(res.validation.code).toBe('SELF_LOOP');
    expect(res.graph).toBe(graph);
    expect(JSON.stringify(graph)).toBe(snapshot);
  });

  it('rejects duplicate edges without mutating graph', () => {
    const graph = createSampleGraph();
    const snapshot = JSON.stringify(graph);

    const res = addEdge(graph, {
      from: { nodeId: 'msg-1', portId: 'sent' },
      to: { nodeId: 'char-1', portId: 'jump' },
    });

    expect(res.validation.valid).toBe(false);
    expect(res.validation.code).toBe('DUPLICATE_EDGE');
    expect(res.graph).toBe(graph);
    expect(JSON.stringify(graph)).toBe(snapshot);
  });

  it('rejects output -> output, input -> input, and input -> output connections without mutating graph', () => {
    const graph: GraphState = {
      ...createSampleGraph(),
      edges: [],
    };
    const snapshot = JSON.stringify(graph);

    // Output -> Output
    const outToOut = addEdge(graph, {
      from: { nodeId: 'msg-1', portId: 'sent' },
      to: { nodeId: 'timer-1', portId: 'elapsed' },
    });
    expect(outToOut.validation.valid).toBe(false);
    expect(outToOut.validation.code).toBe('INVALID_DIRECTION');
    expect(outToOut.graph).toBe(graph);

    // Input -> Input
    const inToIn = addEdge(graph, {
      from: { nodeId: 'char-1', portId: 'jump' },
      to: { nodeId: 'media-1', portId: 'play' },
    });
    expect(inToIn.validation.valid).toBe(false);
    expect(inToIn.validation.code).toBe('INVALID_DIRECTION');
    expect(inToIn.graph).toBe(graph);

    // Input -> Output
    const inToOut = addEdge(graph, {
      from: { nodeId: 'media-1', portId: 'play' },
      to: { nodeId: 'msg-1', portId: 'sent' },
    });
    expect(inToOut.validation.valid).toBe(false);
    expect(inToOut.validation.code).toBe('INVALID_DIRECTION');
    expect(inToOut.graph).toBe(graph);

    expect(JSON.stringify(graph)).toBe(snapshot);
  });

  it('rejects unsupported / reserved notification port type without mutating graph', () => {
    const graph: GraphState = {
      ...createSampleGraph(),
      edges: [],
    };
    const snapshot = JSON.stringify(graph);

    const res = addEdge(graph, {
      from: { nodeId: 'char-1', portId: 'jumped' },
      to: { nodeId: 'media-1', portId: 'play' },
    });

    expect(res.validation.valid).toBe(false);
    expect(res.validation.code).toBe('UNSUPPORTED_PORT_TYPE');
    expect(res.graph).toBe(graph);
    expect(JSON.stringify(graph)).toBe(snapshot);
  });

  it('rejects direct and multi-hop cycles without mutating graph', () => {
    // 2-node cycle attempt: msg-1 -> char-1 exists; attempting char-1 -> msg-1
    const sample = createSampleGraph();
    const snapshot = JSON.stringify(sample);

    const res2Node = addEdge(sample, {
      from: { nodeId: 'char-1', portId: 'jumped' },
      to: { nodeId: 'msg-1', portId: 'sent' },
    });
    expect(res2Node.validation.valid).toBe(false);
    expect(res2Node.validation.code).toBe('CYCLE_DETECTED');
    expect(res2Node.graph).toBe(sample);
    expect(JSON.stringify(sample)).toBe(snapshot);

    // 3-node cycle attempt: A -> B -> C exists; attempting C -> A
    const threeNodeGraph: GraphState = {
      schemaVersion: 1,
      name: 'Three node chain',
      nodes: [
        { id: 'n1', type: 'message', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'character', position: { x: 100, y: 0 }, data: {} },
        { id: 'n3', type: 'character', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', from: { nodeId: 'n1', portId: 'sent' }, to: { nodeId: 'n2', portId: 'jump' } },
        { id: 'e2', from: { nodeId: 'n2', portId: 'jumped' }, to: { nodeId: 'n3', portId: 'jump' } },
      ],
    };

    const res3Node = validateConnection(threeNodeGraph, {
      from: { nodeId: 'n3', portId: 'jumped' },
      to: { nodeId: 'n1', portId: 'sent' },
    });
    expect(res3Node.valid).toBe(false);
    expect(res3Node.code).toBe('CYCLE_DETECTED');
  });

  it('supports adding, moving, and removing nodes and edges purely', () => {
    let g = createEmptyGraph();
    g = addNode(g, {
      id: 'm1',
      type: 'message',
      position: { x: 10, y: 20 },
      data: { label: 'Hi' },
    });
    g = addNode(g, {
      id: 'c1',
      type: 'character',
      position: { x: 200, y: 20 },
      data: { label: 'Bot' },
    });
    expect(g.nodes).toHaveLength(2);

    const added = addEdge(g, {
      id: 'e-1',
      from: { nodeId: 'm1', portId: 'sent' },
      to: { nodeId: 'c1', portId: 'jump' },
    });
    g = added.graph;
    expect(g.edges).toHaveLength(1);

    const moved = moveNode(g, 'c1', { x: 250, y: 60 });
    expect(moved.nodes.find((n) => n.id === 'c1')?.position).toEqual({ x: 250, y: 60 });

    const edgeRemoved = removeEdge(moved, 'e-1');
    expect(edgeRemoved.edges).toHaveLength(0);

    const nodeRemoved = removeNode(moved, 'm1');
    expect(nodeRemoved.nodes).toHaveLength(1);
    expect(nodeRemoved.edges).toHaveLength(0); // Connected edge automatically cleaned up
  });

  it('sanitizes untrusted JSON fixture fields and strips unknown properties', () => {
    const dirty = {
      schemaVersion: 1,
      name: 'Dirty fixture',
      nodes: [
        {
          id: 'm1',
          type: 'message',
          position: { x: 10, y: 20 },
          data: { label: 'Safe', script: 'alert(1)' },
        },
        {
          id: 'bad-type',
          type: 'shell-exec',
          position: { x: 0, y: 0 },
          data: {},
        },
      ],
      edges: [],
    };

    const clean = sanitizeGraph(dirty);
    expect(clean.nodes).toHaveLength(1);
    expect(clean.nodes[0].data).toEqual({ label: 'Safe' });
    expect('script' in (clean.nodes[0].data as Record<string, unknown>)).toBe(false);
  });

  it('transforms Kotodama phrases deterministically across miyabi, bushido, and kansai styles', () => {
    expect(transformKotodama('こんにちは', 'miyabi')).toContain('花鳥風月');
    expect(transformKotodama('こんにちは', 'bushido')).toContain('でござる');
    expect(transformKotodama('こんにちは', 'kansai')).toContain('知らんけど');
  });

  it('validates all PoC 1 presets and round-trips URL hash encoding safely', () => {
    const chain = createKarakuriChainGraph();
    expect(chain.nodes).toHaveLength(5);
    expect(chain.edges).toHaveLength(4);

    const taiko = createTaikoComboGraph();
    expect(taiko.nodes).toHaveLength(4);
    expect(taiko.edges).toHaveLength(3);

    const sakura = createSenbonzakuraGraph();
    expect(sakura.nodes).toHaveLength(5);
    expect(sakura.edges).toHaveLength(4);

    const hash = encodeGraphToHash(chain);
    expect(hash.startsWith('#emaki=')).toBe(true);

    const decoded = decodeGraphFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(chain.name);
    expect(decoded?.nodes).toHaveLength(5);
    expect(decoded?.edges).toHaveLength(4);

    expect(decodeGraphFromHash('#invalid=123')).toBeNull();
    expect(decodeGraphFromHash('#emaki=!!!not-base64!!!')).toBeNull();
  });
});
