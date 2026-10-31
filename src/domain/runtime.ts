import {
  DispatchLimits,
  DispatchResult,
  EventDelivery,
  GraphState,
  RuntimeEvent,
} from './types';

export const DEFAULT_MAX_HOPS = 8;
export const DEFAULT_MAX_DELIVERIES = 32;

let localEventCounter = 0;

function createEventId(prefix: string, now: number): string {
  localEventCounter += 1;
  return `${prefix}-${now}-${localEventCounter}`;
}

/**
 * Pure, deterministic, bounded event dispatcher.
 * Enforces:
 * - maxHops (default 8)
 * - maxDeliveries (default 32)
 * - visited edge and (edgeId, hop) deduplication so cyclic or malformed graphs
 *   cannot cause an infinite loop.
 */
export function dispatchEvent(
  graph: GraphState,
  sourceNodeId: string,
  sourcePortId: string,
  limits?: DispatchLimits,
  now: number = Date.now()
): DispatchResult {
  const maxHops = limits?.maxHops ?? DEFAULT_MAX_HOPS;
  const maxDeliveries = limits?.maxDeliveries ?? DEFAULT_MAX_DELIVERIES;

  const traceId = createEventId('trace', now);
  const originEvent: RuntimeEvent = {
    eventId: createEventId('evt', now),
    sourceNodeId,
    sourcePortId,
    type: 'trigger',
    createdAt: now,
    traceId,
  };

  const sourceNode = graph.nodes.find((n) => n.id === sourceNodeId);
  if (!sourceNode) {
    return {
      originEvent,
      deliveries: [],
      unhandled: true,
      stoppedByCycle: false,
      truncatedByLimit: false,
      error: `送信元ノード "${sourceNodeId}" が存在しません。`,
    };
  }

  const deliveries: EventDelivery[] = [];
  const visitedEdgeIds = new Set<string>();
  const visitedNodesOnPath = new Set<string>([sourceNodeId]);

  interface QueueItem {
    nodeId: string;
    portId?: string; // Defined on hop 1; on subsequent hops in forged chains, matches any outgoing edge from nodeId
    hop: number;
  }

  const queue: QueueItem[] = [{ nodeId: sourceNodeId, portId: sourcePortId, hop: 1 }];
  let stoppedByCycle = false;
  let truncatedByLimit = false;
  let limitReason: 'MAX_HOPS' | 'MAX_DELIVERIES' | undefined;

  while (queue.length > 0) {
    const current = queue.shift()!;

    const matchingEdges = graph.edges.filter((edge) => {
      if (edge.from.nodeId !== current.nodeId) {
        return false;
      }
      if (current.portId !== undefined) {
        return edge.from.portId === current.portId;
      }
      return true;
    });

    if (matchingEdges.length === 0) {
      continue;
    }

    if (current.hop > maxHops) {
      truncatedByLimit = true;
      limitReason = 'MAX_HOPS';
      break;
    }

    for (const edge of matchingEdges) {
      if (visitedEdgeIds.has(edge.id)) {
        stoppedByCycle = true;
        continue;
      }

      const targetNode = graph.nodes.find((n) => n.id === edge.to.nodeId);
      if (!targetNode) {
        continue;
      }

      if (deliveries.length >= maxDeliveries) {
        truncatedByLimit = true;
        limitReason = 'MAX_DELIVERIES';
        break;
      }

      visitedEdgeIds.add(edge.id);

      const hopEvent: RuntimeEvent =
        current.hop === 1
          ? originEvent
          : {
              eventId: createEventId('evt', now),
              sourceNodeId: edge.from.nodeId,
              sourcePortId: edge.from.portId,
              type: 'trigger',
              createdAt: now,
              traceId,
            };

      deliveries.push({
        event: hopEvent,
        edgeId: edge.id,
        sourceNodeId: edge.from.nodeId,
        sourcePortId: edge.from.portId,
        targetNodeId: targetNode.id,
        targetPortId: edge.to.portId,
        targetBlockType: targetNode.type,
        hop: current.hop,
      });

      const nextOutgoing = graph.edges.filter((e) => e.from.nodeId === targetNode.id);
      if (nextOutgoing.length > 0) {
        if (visitedNodesOnPath.has(targetNode.id)) {
          stoppedByCycle = true;
          // Still check if there are unvisited edges in a forged multi-edge cycle up to maxDeliveries/maxHops
          const hasUnvisitedEdge = nextOutgoing.some((e) => !visitedEdgeIds.has(e.id));
          if (hasUnvisitedEdge) {
            if (current.hop + 1 > maxHops) {
              truncatedByLimit = true;
              limitReason = limitReason ?? 'MAX_HOPS';
            } else {
              queue.push({ nodeId: targetNode.id, hop: current.hop + 1 });
            }
          }
        } else {
          visitedNodesOnPath.add(targetNode.id);
          if (current.hop + 1 > maxHops) {
            truncatedByLimit = true;
            limitReason = limitReason ?? 'MAX_HOPS';
          } else {
            queue.push({ nodeId: targetNode.id, hop: current.hop + 1 });
          }
        }
      }
    }

    if (truncatedByLimit && limitReason === 'MAX_DELIVERIES') {
      break;
    }
  }

  return {
    originEvent,
    deliveries,
    unhandled: deliveries.length === 0,
    stoppedByCycle,
    truncatedByLimit,
    limitReason,
  };
}
