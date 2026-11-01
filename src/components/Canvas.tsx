import React, { useEffect, useRef, useState } from 'react';
import { getBlockPorts } from '../domain/graph';
import { Locale } from '../domain/i18n';
import {
  BlockEdge,
  BlockNode,
  BlockType,
  EdgeEndpoint,
  FilterStyle,
  GraphState,
  PortDefinition,
  Position,
} from '../domain/types';
import { CharacterBlock, CharacterRuntimeState } from './blocks/CharacterBlock';
import { CounterBlock, CounterRuntimeState } from './blocks/CounterBlock';
import { FilterBlock, FilterRuntimeState } from './blocks/FilterBlock';
import { MediaCardBlock, MediaCardRuntimeState } from './blocks/MediaCardBlock';
import { MessageBlock } from './blocks/MessageBlock';
import { TimerBlock } from './blocks/TimerBlock';

export interface CanvasProps {
  graph: GraphState;
  locale?: Locale;
  characterState: Record<string, CharacterRuntimeState>;
  mediaState: Record<string, MediaCardRuntimeState>;
  filterState: Record<string, FilterRuntimeState>;
  counterState: Record<string, CounterRuntimeState>;
  timerSignals: Record<string, number>;
  activeEdgeIds: ReadonlySet<string>;
  activeNodeIds?: ReadonlySet<string>;
  onSendMessage: (nodeId: string) => void;
  onTimerElapsed: (nodeId: string) => void;
  onChangeFilterStyle: (nodeId: string, style: FilterStyle) => void;
  onConnect: (from: EdgeEndpoint, to: EdgeEndpoint) => void;
  onDisconnectEdge: (edgeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, position: Position) => void;
}

const BLOCK_META: Record<
  BlockType,
  { icon: string; badge: string; titleJa: string; titleEn: string; borderStyle: string }
> = {
  message: {
    icon: '📜',
    badge: 'MESSAGE / 文',
    titleJa: '文（メッセージ）',
    titleEn: 'Message Scroll',
    borderStyle: 'solid',
  },
  character: {
    icon: '🎎',
    badge: 'CHARACTER / 人形',
    titleJa: 'からくり人形',
    titleEn: 'Karakuri Puppet',
    borderStyle: 'double',
  },
  timer: {
    icon: '🕰️',
    badge: 'TIMER / 砂時計',
    titleJa: '刻（タイマー）',
    titleEn: 'Hourglass Timer',
    borderStyle: 'dashed',
  },
  'media-card': {
    icon: '🏮',
    badge: 'MEDIA / 絵巻舞台',
    titleJa: '絵巻・舞台',
    titleEn: 'Festival Stage',
    borderStyle: 'solid',
  },
  filter: {
    icon: '⛩️',
    badge: 'FILTER / 言霊変換',
    titleJa: '言霊フィルター',
    titleEn: 'Kotodama Filter',
    borderStyle: 'dotted',
  },
  counter: {
    icon: '🥁',
    badge: 'COUNTER / 大太鼓',
    titleJa: '太鼓カウンター',
    titleEn: 'Taiko Counter',
    borderStyle: 'dashed',
  },
};

const NODE_WIDTH = 248;
const NODE_HEADER_OFFSET_Y = 66;

function getPortCoordinates(node: BlockNode, port: PortDefinition): Position {
  const ports = getBlockPorts(node.type);
  const sameDirPorts = ports.filter((p) => p.direction === port.direction);
  const index = Math.max(
    0,
    sameDirPorts.findIndex((p) => p.id === port.id)
  );
  const x = port.direction === 'input' ? node.position.x : node.position.x + NODE_WIDTH;
  const y = node.position.y + NODE_HEADER_OFFSET_Y + index * 32;
  return { x, y };
}

export const Canvas: React.FC<CanvasProps> = ({
  graph,
  locale = 'ja',
  characterState,
  mediaState,
  filterState,
  counterState,
  timerSignals,
  activeEdgeIds,
  activeNodeIds,
  onSendMessage,
  onTimerElapsed,
  onChangeFilterStyle,
  onConnect,
  onDisconnectEdge,
  onRemoveNode,
  onMoveNode,
}) => {
  const [pendingPort, setPendingPort] = useState<EdgeEndpoint | null>(null);
  const pendingPortRef = useRef<EdgeEndpoint | null>(null);

  const updatePendingPort = (next: EdgeEndpoint | null) => {
    pendingPortRef.current = next;
    setPendingPort(next);
  };

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragPreviewPos, setDragPreviewPos] = useState<Position | null>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Mobile responsive auto-fit scale
  const [boardWidth, setBoardWidth] = useState<number>(1000);
  const [mobileZoomMode, setMobileZoomMode] = useState<'fit' | '100'>('fit');

  useEffect(() => {
    const updateWidth = () => {
      if (canvasRef.current && canvasRef.current.clientWidth > 0) {
        setBoardWidth(canvasRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setBoardWidth(window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const maxNodeRight = Math.max(
    680,
    ...graph.nodes.map((n) => n.position.x + NODE_WIDTH + 28)
  );
  const maxNodeBottom = Math.max(
    560,
    ...graph.nodes.map((n) => n.position.y + 250)
  );

  const isMobileViewport = boardWidth > 0 && boardWidth < 760;
  const stageScale =
    isMobileViewport && mobileZoomMode === 'fit'
      ? Math.max(0.42, Math.min(1, (boardWidth - 12) / maxNodeRight))
      : 1;

  const getEffectiveNode = (node: BlockNode): BlockNode => {
    if (draggingNodeId === node.id && dragPreviewPos) {
      return { ...node, position: dragPreviewPos };
    }
    return node;
  };

  const handlePortClick = (endpoint: EdgeEndpoint) => {
    const currentPending = pendingPortRef.current;
    if (!currentPending) {
      updatePendingPort(endpoint);
      return;
    }
    updatePendingPort(null);
    onConnect(currentPending, endpoint);
  };

  const handleHeaderPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    node: BlockNode
  ) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setDraggingNodeId(node.id);
    setDragPreviewPos(node.position);
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / stageScale - node.position.x,
      y: (e.clientY - rect.top) / stageScale - node.position.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleHeaderPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    node: BlockNode
  ) => {
    if (draggingNodeId !== node.id) {
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const logicalWidth = Math.max(maxNodeRight, rect.width / stageScale);
    const logicalHeight = Math.max(maxNodeBottom, rect.height / stageScale);
    const nextX = Math.max(
      12,
      Math.min(
        logicalWidth - NODE_WIDTH - 12,
        Math.round((e.clientX - rect.left) / stageScale - dragOffsetRef.current.x)
      )
    );
    const nextY = Math.max(
      12,
      Math.min(
        logicalHeight - 160,
        Math.round((e.clientY - rect.top) / stageScale - dragOffsetRef.current.y)
      )
    );
    setDragPreviewPos({ x: nextX, y: nextY });
  };

  const handleHeaderPointerUp = (node: BlockNode) => {
    if (draggingNodeId === node.id && dragPreviewPos) {
      onMoveNode(node.id, dragPreviewPos);
    }
    setDraggingNodeId(null);
    setDragPreviewPos(null);
  };

  const renderEdgePath = (edge: BlockEdge) => {
    const rawSource = graph.nodes.find((n) => n.id === edge.from.nodeId);
    const rawTarget = graph.nodes.find((n) => n.id === edge.to.nodeId);
    if (!rawSource || !rawTarget) {
      return null;
    }
    const sourceNode = getEffectiveNode(rawSource);
    const targetNode = getEffectiveNode(rawTarget);
    const sourcePort = getBlockPorts(sourceNode.type).find(
      (p) => p.id === edge.from.portId
    );
    const targetPort = getBlockPorts(targetNode.type).find(
      (p) => p.id === edge.to.portId
    );
    if (!sourcePort || !targetPort) {
      return null;
    }

    const start = getPortCoordinates(sourceNode, sourcePort);
    const end = getPortCoordinates(targetNode, targetPort);
    const dx = Math.max(60, Math.abs(end.x - start.x) * 0.45);
    const pathD = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const isActive = activeEdgeIds.has(edge.id);

    return (
      <g key={edge.id} className={`edge-group ${isActive ? 'edge-active' : ''}`}>
        <path d={pathD} className="edge-line-underlay" />
        <path
          id={`edge-svg-path-${edge.id}`}
          d={pathD}
          className={`edge-line ${isActive ? 'edge-line-active' : ''}`}
          data-testid={`edge-path-${edge.id}`}
        />
        {isActive && (
          <circle r="8" className="kotodama-orb" data-testid={`edge-orb-${edge.id}`}>
            <animateMotion dur="0.45s" repeatCount="1" path={pathD} />
          </circle>
        )}
        <foreignObject
          x={midX - 42}
          y={midY - 14}
          width={84}
          height={28}
          className="edge-disconnect-fo"
        >
          <button
            type="button"
            className="edge-disconnect-btn"
            data-testid={`disconnect-edge-${edge.id}`}
            aria-label={`接続 ${edge.from.nodeId}.${edge.from.portId} → ${edge.to.nodeId}.${edge.to.portId} を切断 (Disconnect)`}
            onClick={() => onDisconnectEdge(edge.id)}
            title="クリックして水引（接続）を切る (Disconnect)"
          >
            ✂️ {locale === 'ja' ? '切断' : 'Cut'}
          </button>
        </foreignObject>
      </g>
    );
  };

  return (
    <section className="canvas-wrapper" aria-label="からくり絵巻キャンバス (Block Canvas)">
      <div className="canvas-stage-section-header">
        <span className="wiring-badge">
          ⚙️ {locale === 'ja' ? '裏の仕掛け：からくり配線キャンバス' : 'WIRING CANVAS'}
        </span>
        <span className="wiring-sub">
          {locale === 'ja'
            ? 'ブロックの【出力ポート ●】と【入力ポート ●】を繋いだり「✂️ 切断」すると、上の「🎭 実演シアター」のアニメーションが変化します'
            : 'Connect or Cut [●] ports here to re-wire the live animation on the Theater Stage above'}
        </span>
      </div>

      {pendingPort && (
        <div
          className="connection-mode-banner"
          role="status"
          aria-live="polite"
          data-testid="pending-connection-banner"
        >
          <span>
            🎐 {locale === 'ja' ? '水引の結び元を選択中:' : 'Wiring from:'}{' '}
            <strong>
              {pendingPort.nodeId}.{pendingPort.portId}
            </strong>{' '}
            —{' '}
            {locale === 'ja'
              ? '結びたい相手ポートをクリックしてください'
              : 'Tap a target input port to connect'}
          </span>
          <button
            type="button"
            className="secondary-btn small-btn"
            data-testid="cancel-pending-port-btn"
            onClick={() => updatePendingPort(null)}
          >
            {locale === 'ja' ? 'キャンセル' : 'Cancel'}
          </button>
        </div>
      )}

      {isMobileViewport && (
        <div className="mobile-canvas-toolbar" data-testid="mobile-canvas-toolbar">
          <span className="mobile-canvas-hint">
            📱{' '}
            {locale === 'ja'
              ? 'スマホ表示：ピンチ/切替で全体・拡大を選べます'
              : 'Mobile View: Auto-fit or 100% pan'}
          </span>
          <button
            type="button"
            className="mobile-zoom-btn"
            data-testid="mobile-zoom-toggle-btn"
            onClick={() =>
              setMobileZoomMode((m) => (m === 'fit' ? '100' : 'fit'))
            }
          >
            {mobileZoomMode === 'fit'
              ? locale === 'ja'
                ? '🔍 100%拡大'
                : '🔍 100% Zoom'
              : locale === 'ja'
                ? '📐 画面にフィット'
                : '📐 Fit Screen'}
          </button>
        </div>
      )}

      {graph.edges.length === 0 && (
        <div className="canvas-hint" data-testid="canvas-empty-hint" role="note">
          💡{' '}
          {locale === 'ja' ? (
            <>
              手引き: ブロックの出力ポート（右側 <code>sent</code> / <code>out</code> /{' '}
              <code>combo</code> / <code>elapsed</code>
              ）をタップし、別ブロックの入力ポート（左側 <code>in</code> /{' '}
              <code>hit</code> / <code>jump</code> / <code>start</code> /{' '}
              <code>play</code>）をタップすると水引が結ばれます。
            </>
          ) : (
            <>
              Tip: Tap an Output port on the right (<code>sent</code> /{' '}
              <code>out</code> / <code>combo</code> / <code>elapsed</code>), then tap
              an Input port on the left (<code>in</code> / <code>hit</code> /{' '}
              <code>jump</code> / <code>start</code> / <code>play</code>).
            </>
          )}
        </div>
      )}

      <div
        className={`canvas-board ${
          isMobileViewport && mobileZoomMode === '100' ? 'mobile-pan-scroll' : ''
        }`}
        ref={canvasRef}
        data-testid="canvas-board"
        style={
          stageScale < 1
            ? {
                minHeight: `${Math.round(maxNodeBottom * stageScale + 28)}px`,
              }
            : undefined
        }
      >
        <div
          className="canvas-stage"
          style={
            stageScale < 1
              ? {
                  width: `${maxNodeRight}px`,
                  height: `${maxNodeBottom}px`,
                  transform: `scale(${stageScale})`,
                  transformOrigin: 'top left',
                }
              : undefined
          }
        >
          <svg className="canvas-svg-layer" aria-label="ブロック間の水引結線レイヤー">
            <defs>
              <linearGradient
                id="mizuhiki-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <linearGradient
                id="mizuhiki-active-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {graph.edges.map(renderEdgePath)}
          </svg>

          {graph.nodes.map((rawNode) => {
            const node = getEffectiveNode(rawNode);
            const meta = BLOCK_META[node.type];
            const ports = getBlockPorts(node.type);
            const inputPorts = ports.filter((p) => p.direction === 'input');
            const outputPorts = ports.filter((p) => p.direction === 'output');
            const isSpotlight = activeNodeIds?.has(node.id) ?? false;

            return (
              <article
                key={node.id}
                className={`block-card block-type-${node.type} ${
                  isSpotlight ? 'block-active-spotlight' : ''
                }`}
                data-testid={`block-node-${node.id}`}
                data-block-type={node.type}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  width: `${NODE_WIDTH}px`,
                }}
                aria-label={`${meta.titleJa} ブロック (${node.id})`}
              >
                {isSpotlight && (
                  <div className="block-spotlight-floater" aria-hidden="true">
                    ⚡ {locale === 'ja' ? '発動中！' : 'FIRING!'}
                  </div>
                )}
                <div
                  className="block-header"
                  onPointerDown={(e) => handleHeaderPointerDown(e, node)}
                  onPointerMove={(e) => handleHeaderPointerMove(e, node)}
                  onPointerUp={() => handleHeaderPointerUp(node)}
                >
                  <div className="block-title-group">
                    <span className="block-icon" aria-hidden="true">
                      {meta.icon}
                    </span>
                    <div>
                      <span className="block-badge">{meta.badge}</span>
                      <h3 className="block-title">
                        {locale === 'ja' ? meta.titleJa : meta.titleEn}{' '}
                        <small className="node-id-pill">{node.id}</small>
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-delete-btn"
                    data-testid={`delete-node-${node.id}`}
                    aria-label={`ブロック ${node.id} を削除 (Delete block)`}
                    title="ブロックを取り除く"
                    onClick={() => onRemoveNode(node.id)}
                  >
                    ✕
                  </button>
                </div>

                <div className="block-ports-row">
                  <div className="ports-column ports-in">
                    {inputPorts.map((port) => {
                      const isSelected =
                        pendingPort?.nodeId === node.id &&
                        pendingPort?.portId === port.id;
                      return (
                        <button
                          key={port.id}
                          type="button"
                          className={`port-btn port-input ${
                            isSelected ? 'port-selected' : ''
                          }`}
                          data-testid={`port-${node.id}-${port.id}`}
                          aria-label={`${node.id} 入力ポート ${port.id} (${port.portType})`}
                          onClick={() =>
                            handlePortClick({ nodeId: node.id, portId: port.id })
                          }
                        >
                          <span className="port-dot" aria-hidden="true">
                            ●
                          </span>
                          <span className="port-name">{port.id}</span>
                          <span className="port-type-tag">{port.portType}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="ports-column ports-out">
                    {outputPorts.map((port) => {
                      const isSelected =
                        pendingPort?.nodeId === node.id &&
                        pendingPort?.portId === port.id;
                      return (
                        <button
                          key={port.id}
                          type="button"
                          className={`port-btn port-output ${
                            !port.supportedInPoc0 ? 'port-reserved' : ''
                          } ${isSelected ? 'port-selected' : ''}`}
                          data-testid={`port-${node.id}-${port.id}`}
                          aria-label={`${node.id} 出力ポート ${port.id} (${
                            port.portType
                          }${!port.supportedInPoc0 ? ' 予約済み' : ''})`}
                          onClick={() =>
                            handlePortClick({ nodeId: node.id, portId: port.id })
                          }
                        >
                          <span className="port-name">{port.id}</span>
                          <span className="port-type-tag">
                            {port.portType}
                            {!port.supportedInPoc0
                              ? locale === 'ja'
                                ? ' (予約)'
                                : ' (rsv)'
                              : ''}
                          </span>
                          <span className="port-dot" aria-hidden="true">
                            ●
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {node.type === 'message' && (
                  <MessageBlock node={node} onSend={onSendMessage} />
                )}
                {node.type === 'character' && (
                  <CharacterBlock node={node} runtime={characterState[node.id]} />
                )}
                {node.type === 'timer' && (
                  <TimerBlock
                    node={node}
                    startSignal={timerSignals[node.id] ?? 0}
                    onElapsed={onTimerElapsed}
                  />
                )}
                {node.type === 'media-card' && (
                  <MediaCardBlock node={node} runtime={mediaState[node.id]} />
                )}
                {node.type === 'filter' && (
                  <FilterBlock
                    node={node}
                    runtime={filterState[node.id]}
                    onChangeStyle={onChangeFilterStyle}
                  />
                )}
                {node.type === 'counter' && (
                  <CounterBlock node={node} runtime={counterState[node.id]} />
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div
        className="connections-bar"
        aria-label="現在の水引接続一覧 (Active Connections)"
      >
        <span className="connections-bar-label">
          🎐 {locale === 'ja' ? '結ばれている水引' : 'Active Cords'} (
          {graph.edges.length}) — <small>{graph.name}</small>:
        </span>
        {graph.edges.length === 0 ? (
          <span className="connections-none" data-testid="no-active-edges">
            {locale === 'ja' ? 'なし (未接続)' : 'None (Disconnected)'}
          </span>
        ) : (
          <ul className="connections-list">
            {graph.edges.map((edge) => (
              <li
                key={edge.id}
                className="connection-chip"
                data-testid={`edge-chip-${edge.id}`}
              >
                <span>
                  <code>
                    {edge.from.nodeId}.{edge.from.portId}
                  </code>{' '}
                  →{' '}
                  <code>
                    {edge.to.nodeId}.{edge.to.portId}
                  </code>
                </span>
                <button
                  type="button"
                  className="chip-disconnect-btn"
                  data-testid={`chip-disconnect-${edge.id}`}
                  aria-label={`${edge.from.nodeId}.${edge.from.portId} から ${edge.to.nodeId}.${edge.to.portId} の接続を解除`}
                  onClick={() => onDisconnectEdge(edge.id)}
                >
                  {locale === 'ja' ? '切断' : 'Cut'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
