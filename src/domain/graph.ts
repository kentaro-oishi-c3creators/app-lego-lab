import {
  BlockEdge,
  BlockNode,
  BlockNodeData,
  BlockType,
  EdgeEndpoint,
  FilterStyle,
  GraphState,
  PortDefinition,
  Position,
  ValidationResult,
} from './types';

const ALLOWED_BLOCK_TYPES: ReadonlySet<BlockType> = new Set<BlockType>([
  'message',
  'character',
  'timer',
  'media-card',
  'filter',
  'counter',
]);

const ALLOWED_FILTER_STYLES: ReadonlySet<FilterStyle> = new Set<FilterStyle>([
  'bushido',
  'miyabi',
  'kansai',
]);

export const BLOCK_PORTS: Readonly<Record<BlockType, readonly PortDefinition[]>> = {
  message: [
    {
      id: 'sent',
      label: 'sent (文送信)',
      direction: 'output',
      portType: 'trigger',
      supportedInPoc0: true,
    },
  ],
  character: [
    {
      id: 'jump',
      label: 'jump (舞・跳躍)',
      direction: 'input',
      portType: 'trigger',
      supportedInPoc0: true,
    },
    {
      id: 'landed',
      label: 'landed (着地連鎖)',
      direction: 'output',
      portType: 'trigger',
      supportedInPoc0: true,
    },
    {
      id: 'jumped',
      label: 'jumped (通知・予約)',
      direction: 'output',
      portType: 'notification',
      supportedInPoc0: false,
    },
  ],
  timer: [
    {
      id: 'start',
      label: 'start (刻開始)',
      direction: 'input',
      portType: 'trigger',
      supportedInPoc0: true,
    },
    {
      id: 'elapsed',
      label: 'elapsed (刻満了)',
      direction: 'output',
      portType: 'trigger',
      supportedInPoc0: true,
    },
  ],
  'media-card': [
    {
      id: 'play',
      label: 'play (演舞切替)',
      direction: 'input',
      portType: 'trigger',
      supportedInPoc0: true,
    },
  ],
  filter: [
    {
      id: 'in',
      label: 'in (言霊受)',
      direction: 'input',
      portType: 'trigger',
      supportedInPoc0: true,
    },
    {
      id: 'out',
      label: 'out (言霊送)',
      direction: 'output',
      portType: 'trigger',
      supportedInPoc0: true,
    },
  ],
  counter: [
    {
      id: 'hit',
      label: 'hit (太鼓打)',
      direction: 'input',
      portType: 'trigger',
      supportedInPoc0: true,
    },
    {
      id: 'combo',
      label: 'combo (満願発動)',
      direction: 'output',
      portType: 'trigger',
      supportedInPoc0: true,
    },
  ],
};

export function getBlockPorts(type: BlockType): readonly PortDefinition[] {
  return BLOCK_PORTS[type] ?? [];
}

export function getPortDefinition(
  type: BlockType,
  portId: string
): PortDefinition | undefined {
  return getBlockPorts(type).find((p) => p.id === portId);
}

/**
 * Pure check for whether adding a directed edge `fromNodeId -> toNodeId`
 * would create a cycle in `edges`.
 */
export function wouldCreateCycle(
  edges: readonly BlockEdge[],
  fromNodeId: string,
  toNodeId: string
): boolean {
  if (fromNodeId === toNodeId) {
    return true;
  }

  const visited = new Set<string>();
  const queue: string[] = [toNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromNodeId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    for (const edge of edges) {
      if (edge.from.nodeId === current && !visited.has(edge.to.nodeId)) {
        queue.push(edge.to.nodeId);
      }
    }
  }

  return false;
}

/**
 * Pure validation of a proposed connection before inserting into the graph.
 */
export function validateConnection(
  graph: GraphState,
  proposed: { from: EdgeEndpoint; to: EdgeEndpoint }
): ValidationResult {
  const sourceNode = graph.nodes.find((n) => n.id === proposed.from.nodeId);
  const targetNode = graph.nodes.find((n) => n.id === proposed.to.nodeId);

  if (!sourceNode || !targetNode) {
    return {
      valid: false,
      code: 'NODE_NOT_FOUND',
      message: '接続元または接続先のブロックが存在しません (Node not found).',
    };
  }

  if (proposed.from.nodeId === proposed.to.nodeId) {
    return {
      valid: false,
      code: 'SELF_LOOP',
      message: '同じブロック自身には接続できません (Self-loop is not allowed).',
    };
  }

  const isDuplicate = graph.edges.some(
    (e) =>
      e.from.nodeId === proposed.from.nodeId &&
      e.from.portId === proposed.from.portId &&
      e.to.nodeId === proposed.to.nodeId &&
      e.to.portId === proposed.to.portId
  );
  if (isDuplicate) {
    return {
      valid: false,
      code: 'DUPLICATE_EDGE',
      message: '同じポート間の接続が既に存在します (Duplicate connection).',
    };
  }

  if (wouldCreateCycle(graph.edges, proposed.from.nodeId, proposed.to.nodeId)) {
    return {
      valid: false,
      code: 'CYCLE_DETECTED',
      message: 'ループ（閉路）になる接続は追加できません (Cycle detected).',
    };
  }

  const sourcePort = getPortDefinition(sourceNode.type, proposed.from.portId);
  const targetPort = getPortDefinition(targetNode.type, proposed.to.portId);

  if (!sourcePort || !targetPort) {
    return {
      valid: false,
      code: 'PORT_NOT_FOUND',
      message: '指定されたポートが見つかりません (Port not found).',
    };
  }

  if (sourcePort.direction !== 'output' || targetPort.direction !== 'input') {
    return {
      valid: false,
      code: 'INVALID_DIRECTION',
      message: `出力ポートから入力ポートへ接続してください (${sourcePort.direction} → ${targetPort.direction} は不可).`,
    };
  }

  if (!sourcePort.supportedInPoc0 || !targetPort.supportedInPoc0) {
    return {
      valid: false,
      code: 'UNSUPPORTED_PORT_TYPE',
      message: `ポート「${!sourcePort.supportedInPoc0 ? sourcePort.id : targetPort.id}」(${!sourcePort.supportedInPoc0 ? sourcePort.portType : targetPort.portType}) は予約済み・未対応です (Unsupported event type).`,
    };
  }

  if (sourcePort.portType !== targetPort.portType) {
    return {
      valid: false,
      code: 'INCOMPATIBLE_PORT_TYPE',
      message: `ポートの型が一致しません (${sourcePort.portType} → ${targetPort.portType}).`,
    };
  }

  return { valid: true };
}

/**
 * Pure edge insertion. Never mutates `graph`.
 * If validation fails, returns the exact original `graph` reference unchanged.
 */
export function addEdge(
  graph: GraphState,
  proposed: { id?: string; from: EdgeEndpoint; to: EdgeEndpoint }
): { graph: GraphState; validation: ValidationResult; addedEdge?: BlockEdge } {
  const validation = validateConnection(graph, proposed);
  if (!validation.valid) {
    return { graph, validation };
  }

  const edgeId =
    proposed.id ??
    `edge-${proposed.from.nodeId}-${proposed.from.portId}-${proposed.to.nodeId}-${proposed.to.portId}-${graph.edges.length + 1}`;

  const newEdge: BlockEdge = {
    id: edgeId,
    from: { nodeId: proposed.from.nodeId, portId: proposed.from.portId },
    to: { nodeId: proposed.to.nodeId, portId: proposed.to.portId },
  };

  return {
    graph: {
      ...graph,
      edges: [...graph.edges, newEdge],
    },
    validation,
    addedEdge: newEdge,
  };
}

export function removeEdge(graph: GraphState, edgeId: string): GraphState {
  if (!graph.edges.some((e) => e.id === edgeId)) {
    return graph;
  }
  return {
    ...graph,
    edges: graph.edges.filter((e) => e.id !== edgeId),
  };
}

export function sanitizeNodeData(
  type: BlockType,
  data: BlockNodeData | undefined
): BlockNodeData {
  const sanitized: BlockNodeData = {};
  if (typeof data?.label === 'string') {
    sanitized.label = data.label.replace(/[<>]/g, '').trim().slice(0, 60);
  }
  if (type === 'timer') {
    const rawDuration =
      typeof data?.durationSeconds === 'number' ? data.durationSeconds : 3;
    sanitized.durationSeconds = Math.max(1, Math.min(5, Math.round(rawDuration)));
  }
  if (type === 'filter') {
    const rawStyle = data?.filterStyle;
    sanitized.filterStyle =
      rawStyle && ALLOWED_FILTER_STYLES.has(rawStyle) ? rawStyle : 'miyabi';
  }
  if (type === 'counter') {
    const rawCount = typeof data?.targetCount === 'number' ? data.targetCount : 3;
    sanitized.targetCount = Math.max(2, Math.min(5, Math.round(rawCount)));
  }
  return sanitized;
}

export function addNode(graph: GraphState, node: BlockNode): GraphState {
  if (!ALLOWED_BLOCK_TYPES.has(node.type)) {
    return graph;
  }
  if (graph.nodes.some((n) => n.id === node.id)) {
    return graph;
  }
  const safeNode: BlockNode = {
    id: String(node.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || `node-${graph.nodes.length + 1}`,
    type: node.type,
    position: {
      x: Number.isFinite(node.position.x) ? node.position.x : 80,
      y: Number.isFinite(node.position.y) ? node.position.y : 80,
    },
    data: sanitizeNodeData(node.type, node.data),
  };
  return {
    ...graph,
    nodes: [...graph.nodes, safeNode],
  };
}

export function updateNodeData(
  graph: GraphState,
  nodeId: string,
  partialData: Partial<BlockNodeData>
): GraphState {
  const target = graph.nodes.find((n) => n.id === nodeId);
  if (!target) {
    return graph;
  }
  const merged = sanitizeNodeData(target.type, {
    ...target.data,
    ...partialData,
  });
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, data: merged } : n)),
  };
}

export function removeNode(graph: GraphState, nodeId: string): GraphState {
  if (!graph.nodes.some((n) => n.id === nodeId)) {
    return graph;
  }
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    edges: graph.edges.filter(
      (e) => e.from.nodeId !== nodeId && e.to.nodeId !== nodeId
    ),
  };
}

export function moveNode(
  graph: GraphState,
  nodeId: string,
  position: Position
): GraphState {
  const target = graph.nodes.find((n) => n.id === nodeId);
  if (!target) {
    return graph;
  }
  const nextX = Number.isFinite(position.x)
    ? Math.max(0, Math.round(position.x))
    : target.position.x;
  const nextY = Number.isFinite(position.y)
    ? Math.max(0, Math.round(position.y))
    : target.position.y;
  if (target.position.x === nextX && target.position.y === nextY) {
    return graph;
  }
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId ? { ...n, position: { x: nextX, y: nextY } } : n
    ),
  };
}

/**
 * Pure Kotodama (word spirit) text transformer for Filter blocks.
 * Deterministic, safe, zero eval/API calls.
 */
export function transformKotodama(
  inputText: string,
  style: FilterStyle = 'miyabi'
): string {
  const base = (inputText || 'Hello!').trim().slice(0, 40);
  switch (style) {
    case 'bushido':
      return `⚔️ いざ参らん！「${base}」でござる🔥`;
    case 'miyabi':
      return `🌸 花鳥風月〜 ${base} かな ✨`;
    case 'kansai':
      return `🎉 めっちゃ「${base}」やん！知らんけど🏮`;
    default:
      return base;
  }
}

export function sanitizeGraph(raw: unknown): GraphState {
  const obj =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const schemaVersion =
    typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 1;
  const name =
    typeof obj.name === 'string' ? obj.name.slice(0, 80) : 'App LEGO Graph';

  let state: GraphState = {
    schemaVersion,
    name,
    nodes: [],
    edges: [],
  };

  if (Array.isArray(obj.nodes)) {
    for (const rawNode of obj.nodes) {
      if (typeof rawNode === 'object' && rawNode !== null) {
        const n = rawNode as Record<string, unknown>;
        const type = n.type as BlockType;
        if (typeof n.id === 'string' && ALLOWED_BLOCK_TYPES.has(type)) {
          const pos =
            typeof n.position === 'object' && n.position !== null
              ? (n.position as Record<string, unknown>)
              : {};
          const data =
            typeof n.data === 'object' && n.data !== null
              ? (n.data as BlockNodeData)
              : {};
          state = addNode(state, {
            id: n.id,
            type,
            position: {
              x: typeof pos.x === 'number' ? pos.x : 80,
              y: typeof pos.y === 'number' ? pos.y : 80,
            },
            data,
          });
        }
      }
    }
  }

  if (Array.isArray(obj.edges)) {
    for (const rawEdge of obj.edges) {
      if (typeof rawEdge === 'object' && rawEdge !== null) {
        const e = rawEdge as Record<string, unknown>;
        const from =
          typeof e.from === 'object' && e.from !== null
            ? (e.from as Record<string, unknown>)
            : {};
        const to =
          typeof e.to === 'object' && e.to !== null
            ? (e.to as Record<string, unknown>)
            : {};
        if (
          typeof from.nodeId === 'string' &&
          typeof from.portId === 'string' &&
          typeof to.nodeId === 'string' &&
          typeof to.portId === 'string'
        ) {
          const res = addEdge(state, {
            id: typeof e.id === 'string' ? e.id : undefined,
            from: { nodeId: from.nodeId, portId: from.portId },
            to: { nodeId: to.nodeId, portId: to.portId },
          });
          state = res.graph;
        }
      }
    }
  }

  return state;
}
