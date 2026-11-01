export type BlockType =
  | 'message'
  | 'character'
  | 'timer'
  | 'media-card'
  | 'filter'
  | 'counter';

/**
 * In PoC 0/1, only 'trigger' is active for connections.
 * 'notification' is reserved as an unsupported port type so incompatible/unsupported
 * port connections can be deterministically rejected and tested (Gate G02).
 */
export type PortType = 'trigger' | 'notification';

export type PortDirection = 'input' | 'output';

export type FilterStyle = 'bushido' | 'miyabi' | 'kansai';

export interface PortDefinition {
  id: string;
  label: string;
  direction: PortDirection;
  portType: PortType;
  supportedInPoc0: boolean;
}

/**
 * Whitelisted node data fields per docs/03_ARCHITECTURE.md.
 * Never store executable code or arbitrary user objects.
 */
export interface BlockNodeData {
  label?: string;
  durationSeconds?: number;
  filterStyle?: FilterStyle;
  targetCount?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface BlockNode {
  id: string;
  type: BlockType;
  position: Position;
  data: BlockNodeData;
}

export interface EdgeEndpoint {
  nodeId: string;
  portId: string;
}

export interface BlockEdge {
  id: string;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
}

export interface GraphState {
  schemaVersion: number;
  name: string;
  nodes: BlockNode[];
  edges: BlockEdge[];
}

export type ValidationErrorCode =
  | 'NODE_NOT_FOUND'
  | 'PORT_NOT_FOUND'
  | 'SELF_LOOP'
  | 'DUPLICATE_EDGE'
  | 'INVALID_DIRECTION'
  | 'UNSUPPORTED_PORT_TYPE'
  | 'INCOMPATIBLE_PORT_TYPE'
  | 'CYCLE_DETECTED';

export interface ValidationResult {
  valid: boolean;
  code?: ValidationErrorCode;
  message?: string;
}

export interface EventPayload {
  text?: string;
  style?: FilterStyle | 'normal';
}

export interface RuntimeEvent {
  eventId: string;
  sourceNodeId: string;
  sourcePortId: string;
  type: 'trigger';
  createdAt: number;
  traceId: string;
  payload?: EventPayload;
}

export interface EventDelivery {
  event: RuntimeEvent;
  edgeId: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  targetBlockType: BlockType;
  hop: number;
}

export interface DispatchLimits {
  maxHops?: number;
  maxDeliveries?: number;
}

export interface DispatchResult {
  originEvent: RuntimeEvent;
  deliveries: EventDelivery[];
  unhandled: boolean;
  stoppedByCycle: boolean;
  truncatedByLimit: boolean;
  limitReason?: 'MAX_HOPS' | 'MAX_DELIVERIES';
  error?: string;
}
