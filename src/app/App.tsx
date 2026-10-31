import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '../components/Canvas';
import { CharacterRuntimeState } from '../components/blocks/CharacterBlock';
import { MediaCardRuntimeState } from '../components/blocks/MediaCardBlock';
import {
  addEdge,
  addNode,
  moveNode,
  removeEdge,
  removeNode,
} from '../domain/graph';
import { dispatchEvent } from '../domain/runtime';
import { createEmptyGraph, createSampleGraph } from '../domain/sampleGraph';
import {
  BlockNode,
  BlockType,
  EdgeEndpoint,
  Position,
} from '../domain/types';
import {
  canUndo,
  createHistory,
  HistoryState,
  pushHistory,
  resetHistory,
  undoHistory,
} from '../state/history';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  summary: string;
  kind: 'dispatch' | 'unhandled' | 'warning' | 'system';
}

const DEFAULT_LABELS: Record<BlockType, string> = {
  message: 'Hello!',
  character: 'Happy bot',
  timer: '3 second timer',
  'media-card': 'Rainbow preview',
};

export const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryState>(() =>
    createHistory(createSampleGraph())
  );
  const historyRef = useRef<HistoryState>(history);
  historyRef.current = history;

  const commitHistory = useCallback((nextHistory: HistoryState) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  }, []);

  const [characterState, setCharacterState] = useState<
    Record<string, CharacterRuntimeState>
  >({});
  const [mediaState, setMediaState] = useState<
    Record<string, MediaCardRuntimeState>
  >({});
  const [activeEdgeIds, setActiveEdgeIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([
    {
      id: 'init-1',
      timestamp: 'Ready',
      summary: 'サンプルグラフを読み込みました (Message → Character, Timer → Media Card)',
      kind: 'system',
    },
  ]);

  const nodeCounterRef = useRef<number>(2);
  const logCounterRef = useRef<number>(1);
  const jumpTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const edgeHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const jumpTimeouts = jumpTimeoutsRef.current;
    return () => {
      Object.values(jumpTimeouts).forEach(clearTimeout);
      if (edgeHighlightTimeoutRef.current) {
        clearTimeout(edgeHighlightTimeoutRef.current);
      }
    };
  }, []);

  const appendLog = useCallback(
    (summary: string, kind: EventLogEntry['kind']) => {
      logCounterRef.current += 1;
      const entryId = `log-${logCounterRef.current}`;
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8);
      setEventLog((prev) => [
        {
          id: entryId,
          timestamp: timeStr,
          summary,
          kind,
        },
        ...prev.slice(0, 29),
      ]);
    },
    []
  );

  const triggerRuntimePort = useCallback(
    (sourceNodeId: string, sourcePortId: string) => {
      setWarningBanner(null);
      const currentGraph = historyRef.current.present;
      const result = dispatchEvent(currentGraph, sourceNodeId, sourcePortId);

      if (result.unhandled) {
        appendLog(
          `${sourceNodeId}.${sourcePortId} -> (未接続のため反応なし / unhandled)`,
          'unhandled'
        );
        return;
      }

      const deliveredEdges = new Set<string>();

      for (const delivery of result.deliveries) {
        deliveredEdges.add(delivery.edgeId);
        appendLog(
          `${delivery.sourceNodeId}.${delivery.sourcePortId} -> ${delivery.targetNodeId}.${delivery.targetPortId}`,
          'dispatch'
        );

        if (
          delivery.targetBlockType === 'character' &&
          delivery.targetPortId === 'jump'
        ) {
          const targetId = delivery.targetNodeId;
          setCharacterState((prev) => ({
            ...prev,
            [targetId]: {
              isJumping: true,
              jumpCount: (prev[targetId]?.jumpCount ?? 0) + 1,
            },
          }));

          if (jumpTimeoutsRef.current[targetId]) {
            clearTimeout(jumpTimeoutsRef.current[targetId]);
          }
          jumpTimeoutsRef.current[targetId] = setTimeout(() => {
            setCharacterState((prev) => ({
              ...prev,
              [targetId]: {
                isJumping: false,
                jumpCount: prev[targetId]?.jumpCount ?? 1,
              },
            }));
          }, 600);
        } else if (
          delivery.targetBlockType === 'media-card' &&
          delivery.targetPortId === 'play'
        ) {
          const targetId = delivery.targetNodeId;
          setMediaState((prev) => {
            const currentPlaying = prev[targetId]?.isPlaying ?? false;
            const currentCount = prev[targetId]?.toggleCount ?? 0;
            return {
              ...prev,
              [targetId]: {
                isPlaying: !currentPlaying,
                toggleCount: currentCount + 1,
              },
            };
          });
        }
      }

      setActiveEdgeIds(deliveredEdges);
      if (edgeHighlightTimeoutRef.current) {
        clearTimeout(edgeHighlightTimeoutRef.current);
      }
      edgeHighlightTimeoutRef.current = setTimeout(() => {
        setActiveEdgeIds(new Set());
      }, 650);
    },
    [appendLog]
  );

  const handleSendMessage = useCallback(
    (nodeId: string) => {
      triggerRuntimePort(nodeId, 'sent');
    },
    [triggerRuntimePort]
  );

  const handleTimerElapsed = useCallback(
    (nodeId: string) => {
      triggerRuntimePort(nodeId, 'elapsed');
    },
    [triggerRuntimePort]
  );

  const handleConnect = useCallback(
    (from: EdgeEndpoint, to: EdgeEndpoint) => {
      const currentGraph = historyRef.current.present;
      const { graph: nextGraph, validation, addedEdge } = addEdge(currentGraph, {
        from,
        to,
      });

      if (!validation.valid) {
        const msg =
          validation.message ?? '不正な接続のため拒否されました (Invalid connection).';
        setWarningBanner(`[${validation.code}] ${msg}`);
        appendLog(
          `接続拒否 (${validation.code}): ${from.nodeId}.${from.portId} -> ${to.nodeId}.${to.portId}`,
          'warning'
        );
        return;
      }

      setWarningBanner(null);
      commitHistory(pushHistory(historyRef.current, nextGraph));
      if (addedEdge) {
        appendLog(
          `接続追加: ${addedEdge.from.nodeId}.${addedEdge.from.portId} -> ${addedEdge.to.nodeId}.${addedEdge.to.portId}`,
          'system'
        );
      }
    },
    [appendLog, commitHistory]
  );

  const handleDisconnectEdge = useCallback(
    (edgeId: string) => {
      const currentGraph = historyRef.current.present;
      const targetEdge = currentGraph.edges.find((e) => e.id === edgeId);
      if (!targetEdge) {
        return;
      }
      setWarningBanner(null);
      const nextGraph = removeEdge(currentGraph, edgeId);
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(
        `接続切断: ${targetEdge.from.nodeId}.${targetEdge.from.portId} -x- ${targetEdge.to.nodeId}.${targetEdge.to.portId}`,
        'system'
      );
    },
    [appendLog, commitHistory]
  );

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      setWarningBanner(null);
      const currentGraph = historyRef.current.present;
      const prefix =
        type === 'message'
          ? 'msg'
          : type === 'character'
            ? 'char'
            : type === 'timer'
              ? 'timer'
              : 'media';

      let idx = nodeCounterRef.current;
      while (currentGraph.nodes.some((n) => n.id === `${prefix}-${idx}`)) {
        idx += 1;
      }
      nodeCounterRef.current = idx + 1;

      const offset = (currentGraph.nodes.length % 4) * 36;
      const isSource = type === 'message' || type === 'timer';
      const newNode: BlockNode = {
        id: `${prefix}-${idx}`,
        type,
        position: {
          x: isSource ? 90 + offset : 420 + offset,
          y: 100 + offset,
        },
        data: {
          label: DEFAULT_LABELS[type],
          ...(type === 'timer' ? { durationSeconds: 3 } : {}),
        },
      };

      const nextGraph = addNode(currentGraph, newNode);
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(`ブロック追加: ${newNode.id} (${type})`, 'system');
    },
    [appendLog, commitHistory]
  );

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      setWarningBanner(null);
      const currentGraph = historyRef.current.present;
      const nextGraph = removeNode(currentGraph, nodeId);
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(`ブロック削除: ${nodeId}`, 'system');
    },
    [appendLog, commitHistory]
  );

  const handleMoveNode = useCallback(
    (nodeId: string, position: Position) => {
      const currentGraph = historyRef.current.present;
      const nextGraph = moveNode(currentGraph, nodeId, position);
      if (nextGraph !== currentGraph) {
        commitHistory(pushHistory(historyRef.current, nextGraph));
      }
    },
    [commitHistory]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo(historyRef.current)) {
      return;
    }
    setWarningBanner(null);
    commitHistory(undoHistory(historyRef.current));
    appendLog('Undo: 直前のグラフ状態を復元しました', 'system');
  }, [appendLog, commitHistory]);

  const handleResetDemo = useCallback(() => {
    setWarningBanner(null);
    setCharacterState({});
    setMediaState({});
    setActiveEdgeIds(new Set());
    commitHistory(resetHistory(createSampleGraph()));
    appendLog('Reset Demo: 初期サンプルグラフにリセットしました', 'system');
  }, [appendLog, commitHistory]);

  const handleEmptyCanvas = useCallback(() => {
    setWarningBanner(null);
    const empty = createEmptyGraph();
    commitHistory(pushHistory(historyRef.current, empty));
    appendLog('Empty Canvas: キャンバスを空にしました', 'system');
  }, [appendLog, commitHistory]);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-title">
          <h1>🧱 App LEGO Lab — PoC 0</h1>
          <p className="subtitle">
            ブロックを配置してつなぐと動きが変わる、ローカル完結・型安全イベントパズル
          </p>
        </div>

        <div className="toolbar-actions" role="toolbar" aria-label="グラフ操作ツールバー">
          <button
            type="button"
            className="toolbar-btn undo-btn"
            data-testid="undo-btn"
            disabled={!canUndo(history)}
            onClick={handleUndo}
            aria-label="元に戻す (Undo)"
          >
            ↩️ Undo (元に戻す) [{history.past.length}]
          </button>
          <button
            type="button"
            className="toolbar-btn empty-btn"
            data-testid="empty-canvas-btn"
            onClick={handleEmptyCanvas}
            aria-label="空のキャンバスにする (Empty Canvas)"
          >
            🧹 Empty Canvas (空にする)
          </button>
          <button
            type="button"
            className="toolbar-btn reset-btn"
            data-testid="reset-demo-btn"
            onClick={handleResetDemo}
            aria-label="デモを初期状態にリセット (Reset Demo)"
          >
            🔄 Reset Demo (初期状態へ)
          </button>
        </div>
      </header>

      {warningBanner && (
        <div
          className="warning-banner"
          role="alert"
          aria-live="assertive"
          data-testid="warning-banner"
        >
          <span>⚠️ {warningBanner}</span>
          <button
            type="button"
            className="warning-dismiss-btn"
            data-testid="dismiss-warning-btn"
            aria-label="警告を閉じる"
            onClick={() => setWarningBanner(null)}
          >
            閉じる
          </button>
        </div>
      )}

      <main className="workspace-grid">
        <aside className="toybox-panel" aria-label="トイボックス (Block Palette)">
          <h2 className="panel-heading">🧰 Toybox (ブロック追加)</h2>
          <p className="panel-help">
            クリックしてキャンバスに追加。出力ポートから入力ポートへつないで動かしましょう。
          </p>
          <div className="palette-list">
            <button
              type="button"
              className="palette-item palette-message"
              data-testid="add-message-btn"
              onClick={() => handleAddBlock('message')}
            >
              <span className="palette-icon" aria-hidden="true">💬</span>
              <span className="palette-text">
                <strong>+ Message (メッセージ)</strong>
                <small>出力: sent (trigger)</small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-character"
              data-testid="add-character-btn"
              onClick={() => handleAddBlock('character')}
            >
              <span className="palette-icon" aria-hidden="true">🤖</span>
              <span className="palette-text">
                <strong>+ Character (キャラクター)</strong>
                <small>入力: jump (trigger)</small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-timer"
              data-testid="add-timer-btn"
              onClick={() => handleAddBlock('timer')}
            >
              <span className="palette-icon" aria-hidden="true">⏱️</span>
              <span className="palette-text">
                <strong>+ Timer (3秒タイマー)</strong>
                <small>出力: elapsed (trigger)</small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-media"
              data-testid="add-media-btn"
              onClick={() => handleAddBlock('media-card')}
            >
              <span className="palette-icon" aria-hidden="true">🎬</span>
              <span className="palette-text">
                <strong>+ Media Card (メディア)</strong>
                <small>入力: play (trigger)</small>
              </span>
            </button>
          </div>

          <section className="event-log-section" aria-label="イベントログ (Event Log)">
            <h2 className="panel-heading">📜 Event Log (動作ログ)</h2>
            <ul className="event-log-list" data-testid="event-log-list">
              {eventLog.map((item) => (
                <li
                  key={item.id}
                  className={`event-log-item log-kind-${item.kind}`}
                  data-testid="event-log-entry"
                  data-log-kind={item.kind}
                >
                  <span className="log-time">{item.timestamp}</span>
                  <span className="log-summary">{item.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <Canvas
          graph={history.present}
          characterState={characterState}
          mediaState={mediaState}
          activeEdgeIds={activeEdgeIds}
          onSendMessage={handleSendMessage}
          onTimerElapsed={handleTimerElapsed}
          onConnect={handleConnect}
          onDisconnectEdge={handleDisconnectEdge}
          onRemoveNode={handleRemoveNode}
          onMoveNode={handleMoveNode}
        />
      </main>
    </div>
  );
};
