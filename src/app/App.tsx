import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '../components/Canvas';
import { GuideModal } from '../components/GuideModal';
import { CharacterRuntimeState } from '../components/blocks/CharacterBlock';
import { CounterRuntimeState } from '../components/blocks/CounterBlock';
import { FilterRuntimeState } from '../components/blocks/FilterBlock';
import { MediaCardRuntimeState } from '../components/blocks/MediaCardBlock';
import {
  addEdge,
  addNode,
  moveNode,
  removeEdge,
  removeNode,
  transformKotodama,
  updateNodeData,
} from '../domain/graph';
import { Locale, UI_TEXT } from '../domain/i18n';
import { dispatchEvent } from '../domain/runtime';
import {
  createEmptyGraph,
  createSampleGraph,
  decodeGraphFromHash,
  encodeGraphToHash,
  PRESET_RECIPES,
} from '../domain/sampleGraph';
import {
  BlockNode,
  BlockType,
  EdgeEndpoint,
  EventPayload,
  FilterStyle,
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

export type TourState = 0 | 1 | 2 | 'completed' | 'dismissed';

const DEFAULT_LABELS: Record<BlockType, string> = {
  message: 'Hello!',
  character: 'Happy bot',
  timer: '3 second timer',
  'media-card': 'Rainbow preview',
  filter: '雅（みやび）言霊',
  counter: '三連大太鼓',
};

const MAX_CHAIN_STEPS = 8;

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('ja');
  const t = UI_TEXT[locale];

  const [history, setHistory] = useState<HistoryState>(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#emaki=')) {
      const decoded = decodeGraphFromHash(window.location.hash);
      if (decoded) {
        return createHistory(decoded);
      }
    }
    return createHistory(createSampleGraph());
  });
  const historyRef = useRef<HistoryState>(history);
  historyRef.current = history;

  const commitHistory = useCallback((nextHistory: HistoryState) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  }, []);

  const [activePresetId, setActivePresetId] = useState<string>('poc0-basic');
  const [tourState, setTourState] = useState<TourState>(0);
  const tourStateRef = useRef<TourState>(tourState);
  tourStateRef.current = tourState;

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideInitialTab, setGuideInitialTab] = useState<
    'slides' | 'manual' | 'architecture'
  >('slides');

  const [characterState, setCharacterState] = useState<
    Record<string, CharacterRuntimeState>
  >({});
  const [mediaState, setMediaState] = useState<
    Record<string, MediaCardRuntimeState>
  >({});
  const [filterState, setFilterState] = useState<
    Record<string, FilterRuntimeState>
  >({});
  const counterStateRef = useRef<Record<string, CounterRuntimeState>>({});
  const [counterState, setCounterState] = useState<
    Record<string, CounterRuntimeState>
  >({});
  const [timerSignals, setTimerSignals] = useState<Record<string, number>>({});
  const [activeEdgeIds, setActiveEdgeIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Karakuri Craft Studio ("からくり工房") state
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [craftType, setCraftType] = useState<BlockType>('character');
  const [craftLabel, setCraftLabel] = useState<string>('千本桜からくり');
  const [craftFilterStyle, setCraftFilterStyle] = useState<FilterStyle>('miyabi');
  const [craftTargetCount, setCraftTargetCount] = useState<number>(3);
  const [craftDuration, setCraftDuration] = useState<number>(2);
  const [lastCraftReceipt, setLastCraftReceipt] = useState<string | null>(null);

  const [eventLog, setEventLog] = useState<EventLogEntry[]>([
    {
      id: 'init-1',
      timestamp: 'Ready',
      summary: '絵巻を読み込みました (Message → Character, Timer → Media Card)',
      kind: 'system',
    },
  ]);

  const nodeCounterRef = useRef<number>(2);
  const logCounterRef = useRef<number>(1);
  const jumpTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const chainTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const edgeHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const jumpTimeouts = jumpTimeoutsRef.current;
    const chainTimeouts = chainTimeoutsRef.current;
    return () => {
      Object.values(jumpTimeouts).forEach(clearTimeout);
      chainTimeouts.forEach(clearTimeout);
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

  const resetRuntimeTransientState = useCallback(() => {
    setCharacterState({});
    setMediaState({});
    setFilterState({});
    counterStateRef.current = {};
    setCounterState({});
    setTimerSignals({});
    setActiveEdgeIds(new Set());
  }, []);

  const triggerRuntimePort = useCallback(
    (
      sourceNodeId: string,
      sourcePortId: string,
      incomingPayload?: EventPayload,
      chainDepth: number = 1
    ) => {
      if (chainDepth > MAX_CHAIN_STEPS) {
        appendLog(
          `安全上限 (MAX_CHAIN_STEPS=${MAX_CHAIN_STEPS}) により連鎖を停止しました`,
          'warning'
        );
        return;
      }

      setWarningBanner(null);
      const currentGraph = historyRef.current.present;
      const sourceNode = currentGraph.nodes.find((n) => n.id === sourceNodeId);
      const effectivePayload: EventPayload = incomingPayload ?? {
        text: sourceNode?.data.label || 'Hello!',
        style: 'normal',
      };

      const result = dispatchEvent(currentGraph, sourceNodeId, sourcePortId);

      // Only process direct 1-hop deliveries from the firing port so multi-stage
      // blocks (Filter, Counter, Character.landed, Timer.start) control their own
      // transformation, counting, and timing deterministically.
      const directDeliveries = result.deliveries.filter((d) => d.hop === 1);

      if (directDeliveries.length === 0) {
        appendLog(
          `${sourceNodeId}.${sourcePortId} -> (未接続のため反応なし / unhandled)`,
          'unhandled'
        );
        return;
      }

      const deliveredEdges = new Set<string>();

      for (const delivery of directDeliveries) {
        deliveredEdges.add(delivery.edgeId);
        appendLog(
          `${delivery.sourceNodeId}.${delivery.sourcePortId} -> ${delivery.targetNodeId}.${delivery.targetPortId}`,
          'dispatch'
        );

        const targetId = delivery.targetNodeId;
        const targetNode = currentGraph.nodes.find((n) => n.id === targetId);

        if (
          delivery.targetBlockType === 'character' &&
          delivery.targetPortId === 'jump'
        ) {
          const speechText = effectivePayload.text;
          setCharacterState((prev) => ({
            ...prev,
            [targetId]: {
              isJumping: true,
              jumpCount: (prev[targetId]?.jumpCount ?? 0) + 1,
              lastSpeechText: speechText,
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
                lastSpeechText: prev[targetId]?.lastSpeechText,
              },
            }));
          }, 600);

          // Advance Opening Act Step 1 -> Step 2 when puppet jumps!
          if (tourStateRef.current === 0) {
            tourStateRef.current = 1;
            setTourState(1);
          }

          // If Character.landed has outgoing connections, fire landed trigger!
          const hasLandedEdges = currentGraph.edges.some(
            (e) => e.from.nodeId === targetId && e.from.portId === 'landed'
          );
          if (hasLandedEdges) {
            if (tourStateRef.current === 2) {
              tourStateRef.current = 'completed';
              setTourState('completed');
            }
            triggerRuntimePort(targetId, 'landed', effectivePayload, chainDepth + 1);
          }
        } else if (
          delivery.targetBlockType === 'media-card' &&
          delivery.targetPortId === 'play'
        ) {
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
        } else if (
          delivery.targetBlockType === 'filter' &&
          delivery.targetPortId === 'in'
        ) {
          const style: FilterStyle = targetNode?.data.filterStyle ?? 'miyabi';
          const transformedText = transformKotodama(
            effectivePayload.text || 'Hello!',
            style
          );
          setFilterState((prev) => ({
            ...prev,
            [targetId]: {
              isPulsing: true,
              lastOutputText: transformedText,
              passCount: (prev[targetId]?.passCount ?? 0) + 1,
            },
          }));

          const hasOutEdges = currentGraph.edges.some(
            (e) => e.from.nodeId === targetId && e.from.portId === 'out'
          );
          if (hasOutEdges) {
            triggerRuntimePort(
              targetId,
              'out',
              { text: transformedText, style },
              chainDepth + 1
            );
          }
        } else if (
          delivery.targetBlockType === 'counter' &&
          delivery.targetPortId === 'hit'
        ) {
          const targetThreshold = Math.max(
            2,
            Math.min(5, targetNode?.data.targetCount ?? 3)
          );
          const prevCounter = counterStateRef.current[targetId] ?? {
            currentCount: 0,
            comboCount: 0,
            isTriggered: false,
          };
          const nextHit = prevCounter.currentCount + 1;
          if (nextHit >= targetThreshold) {
            const nextState: CounterRuntimeState = {
              currentCount: 0,
              comboCount: prevCounter.comboCount + 1,
              isTriggered: true,
            };
            counterStateRef.current = {
              ...counterStateRef.current,
              [targetId]: nextState,
            };
            setCounterState({ ...counterStateRef.current });

            const hasComboEdges = currentGraph.edges.some(
              (e) => e.from.nodeId === targetId && e.from.portId === 'combo'
            );
            if (hasComboEdges) {
              triggerRuntimePort(
                targetId,
                'combo',
                {
                  text: `🎇 満願奥義・${effectivePayload.text || 'ドドン！'}`,
                  style: effectivePayload.style,
                },
                chainDepth + 1
              );
            }
          } else {
            const nextState: CounterRuntimeState = {
              currentCount: nextHit,
              comboCount: prevCounter.comboCount,
              isTriggered: false,
            };
            counterStateRef.current = {
              ...counterStateRef.current,
              [targetId]: nextState,
            };
            setCounterState({ ...counterStateRef.current });
          }
        } else if (
          delivery.targetBlockType === 'timer' &&
          delivery.targetPortId === 'start'
        ) {
          setTimerSignals((prev) => ({
            ...prev,
            [targetId]: (prev[targetId] ?? 0) + 1,
          }));
        }
      }

      setActiveEdgeIds((prev) => {
        const merged = new Set(prev);
        deliveredEdges.forEach((id) => merged.add(id));
        return merged;
      });
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
      const node = historyRef.current.present.nodes.find((n) => n.id === nodeId);
      triggerRuntimePort(nodeId, 'sent', {
        text: node?.data.label || 'Hello!',
        style: 'normal',
      });
    },
    [triggerRuntimePort]
  );

  const handleTimerElapsed = useCallback(
    (nodeId: string) => {
      triggerRuntimePort(nodeId, 'elapsed', {
        text: '⏳ 刻満了！',
        style: 'normal',
      });
    },
    [triggerRuntimePort]
  );

  const handleChangeFilterStyle = useCallback(
    (nodeId: string, style: FilterStyle) => {
      const currentGraph = historyRef.current.present;
      const nextGraph = updateNodeData(currentGraph, nodeId, {
        filterStyle: style,
      });
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(`言霊スタイル変更: ${nodeId} -> ${style}`, 'system');
    },
    [appendLog, commitHistory]
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
          `水引接続: ${addedEdge.from.nodeId}.${addedEdge.from.portId} -> ${addedEdge.to.nodeId}.${addedEdge.to.portId}`,
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
      if (tourStateRef.current === 1) {
        tourStateRef.current = 2;
        setTourState(2);
      }
    },
    [appendLog, commitHistory]
  );

  const handleAddBlock = useCallback(
    (type: BlockType, customData?: BlockNode['data']) => {
      setWarningBanner(null);
      const currentGraph = historyRef.current.present;
      const prefix =
        type === 'message'
          ? 'msg'
          : type === 'character'
            ? 'char'
            : type === 'timer'
              ? 'timer'
              : type === 'media-card'
                ? 'media'
                : type === 'filter'
                  ? 'filter'
                  : 'counter';

      let idx = nodeCounterRef.current;
      while (currentGraph.nodes.some((n) => n.id === `${prefix}-${idx}`)) {
        idx += 1;
      }
      nodeCounterRef.current = idx + 1;

      const offset = (currentGraph.nodes.length % 5) * 32;
      const isSource = type === 'message' || type === 'timer';
      const isMiddle = type === 'filter' || type === 'counter';
      const newNode: BlockNode = {
        id: `${prefix}-${idx}`,
        type,
        position: {
          x: isSource ? 70 + offset : isMiddle ? 340 + offset : 610 + offset,
          y: 90 + offset,
        },
        data: {
          label: customData?.label || DEFAULT_LABELS[type],
          ...(type === 'timer'
            ? { durationSeconds: customData?.durationSeconds ?? 3 }
            : {}),
          ...(type === 'filter'
            ? { filterStyle: customData?.filterStyle ?? 'miyabi' }
            : {}),
          ...(type === 'counter'
            ? { targetCount: customData?.targetCount ?? 3 }
            : {}),
        },
      };

      const nextGraph = addNode(currentGraph, newNode);
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(`ブロック召喚: ${newNode.id} (${newNode.data.label})`, 'system');
      return newNode;
    },
    [appendLog, commitHistory]
  );

  const handleCraftSummon = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const safeLabel =
        craftLabel.replace(/[<>]/g, '').trim().slice(0, 40) ||
        DEFAULT_LABELS[craftType];
      const summoned = handleAddBlock(craftType, {
        label: safeLabel,
        filterStyle: craftFilterStyle,
        targetCount: craftTargetCount,
        durationSeconds: craftDuration,
      });
      setLastCraftReceipt(
        locale === 'ja'
          ? `💮 JIDOKA 検査 PASS [G02:型安全 / G06:eval禁止・無害化] → 「${summoned.data.label}」(${summoned.id}) を絵巻へ召喚しました！`
          : `💮 JIDOKA PASS [G02:Type-Safe / G06:Sanitized] → Summoned "${summoned.data.label}" (${summoned.id}) onto the scroll!`
      );
    },
    [
      craftDuration,
      craftFilterStyle,
      craftLabel,
      craftTargetCount,
      craftType,
      handleAddBlock,
      locale,
    ]
  );

  const handleSelectPreset = useCallback(
    (presetId: string) => {
      const preset = PRESET_RECIPES.find((p) => p.id === presetId);
      if (!preset) {
        return;
      }
      setWarningBanner(null);
      setShareToast(null);
      setActivePresetId(presetId);
      resetRuntimeTransientState();
      const nextGraph = preset.create();
      commitHistory(pushHistory(historyRef.current, nextGraph));
      appendLog(`絵巻切替: ${preset.titleJa}`, 'system');
    },
    [appendLog, commitHistory, resetRuntimeTransientState]
  );

  const handleShareUrl = useCallback(() => {
    const hash = encodeGraphToHash(historyRef.current.present);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', hash);
      const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      }
    }
    setShareToast(
      locale === 'ja'
        ? `🔗 絵巻URLを生成しました (${hash.slice(0, 28)}...)`
        : `🔗 Scroll URL generated (${hash.slice(0, 28)}...)`
    );
    appendLog('絵巻URLをハッシュに保存・共有準備しました', 'system');
  }, [appendLog, locale]);

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
    appendLog('Undo: 直前の絵巻状態を復元しました', 'system');
    if (tourStateRef.current === 1) {
      tourStateRef.current = 2;
      setTourState(2);
    }
  }, [appendLog, commitHistory]);

  const handleResetDemo = useCallback(() => {
    setWarningBanner(null);
    setShareToast(null);
    setActivePresetId('poc0-basic');
    resetRuntimeTransientState();
    commitHistory(resetHistory(createSampleGraph()));
    appendLog('Reset Demo: 壱ノ巻（初期サンプル）にリセットしました', 'system');
  }, [appendLog, commitHistory, resetRuntimeTransientState]);

  const handleEmptyCanvas = useCallback(() => {
    setWarningBanner(null);
    setShareToast(null);
    resetRuntimeTransientState();
    const empty = createEmptyGraph();
    commitHistory(pushHistory(historyRef.current, empty));
    appendLog('Empty Canvas: 白紙の絵巻にしました', 'system');
  }, [appendLog, commitHistory, resetRuntimeTransientState]);

  const handleOpeningActQuickAction = useCallback(() => {
    if (tourStateRef.current === 0) {
      const firstMsg = historyRef.current.present.nodes.find(
        (n) => n.type === 'message'
      );
      if (firstMsg) {
        handleSendMessage(firstMsg.id);
      }
    } else if (tourStateRef.current === 1) {
      const firstEdge = historyRef.current.present.edges[0];
      if (firstEdge) {
        handleDisconnectEdge(firstEdge.id);
      } else {
        tourStateRef.current = 2;
        setTourState(2);
      }
    } else if (tourStateRef.current === 2) {
      handleSelectPreset('karakuri-chain');
      setTimeout(() => {
        handleSendMessage('msg-1');
        tourStateRef.current = 'completed';
        setTourState('completed');
      }, 60);
    }
  }, [handleDisconnectEdge, handleSelectPreset, handleSendMessage]);

  const currentStepData =
    typeof tourState === 'number' ? t.openingAct.steps[tourState] : null;

  return (
    <div className="app-shell" data-locale={locale}>
      <header className="top-bar">
        <div className="brand-title">
          <div className="hanko-seal" aria-hidden="true" title="からくり自働化・匠の印">
            巧
          </div>
          <div>
            <h1>{t.brandTitle}</h1>
            <p className="subtitle">{t.brandSubtitle}</p>
          </div>
        </div>

        <div className="toolbar-actions" role="toolbar" aria-label="絵巻操作ツールバー">
          <button
            type="button"
            className="toolbar-btn guide-open-btn"
            data-testid="open-guide-btn"
            onClick={() => {
              setGuideInitialTab('slides');
              setIsGuideOpen(true);
            }}
            aria-label={t.toolbar.guideAria}
          >
            {t.toolbar.guide}
          </button>
          <button
            type="button"
            className="toolbar-btn lang-toggle-btn"
            data-testid="lang-toggle-btn"
            onClick={() => setLocale((prev) => (prev === 'ja' ? 'en' : 'ja'))}
            aria-label={t.toolbar.langSwitchAria}
          >
            {t.toolbar.langSwitch}
          </button>
          <button
            type="button"
            className="toolbar-btn studio-toggle-btn"
            data-testid="toggle-studio-btn"
            onClick={() => setIsStudioOpen((v) => !v)}
            aria-expanded={isStudioOpen}
            aria-label="からくり工房（カスタムブロック生成）を開く"
          >
            {t.toolbar.studio} {isStudioOpen ? '▲' : '▼'}
          </button>
          <button
            type="button"
            className="toolbar-btn share-btn"
            data-testid="share-url-btn"
            onClick={handleShareUrl}
            aria-label="現在の絵巻をURLハッシュとして共有 (Share URL)"
          >
            {t.toolbar.share}
          </button>
          <button
            type="button"
            className="toolbar-btn undo-btn"
            data-testid="undo-btn"
            disabled={!canUndo(history)}
            onClick={handleUndo}
            aria-label="元に戻す (Undo)"
          >
            {t.toolbar.undoPrefix} [{history.past.length}]
          </button>
          <button
            type="button"
            className="toolbar-btn empty-btn"
            data-testid="empty-canvas-btn"
            onClick={handleEmptyCanvas}
            aria-label="白紙の絵巻にする (Empty Canvas)"
          >
            {t.toolbar.empty}
          </button>
          <button
            type="button"
            className="toolbar-btn reset-btn"
            data-testid="reset-demo-btn"
            onClick={handleResetDemo}
            aria-label="デモを初期状態にリセット (Reset Demo)"
          >
            {t.toolbar.reset}
          </button>
        </div>
      </header>

      <nav className="preset-scroll-bar" aria-label="からくり絵巻プリセット選択">
        <span className="preset-bar-label">{t.presetBarLabel}</span>
        <div className="preset-buttons-row">
          {PRESET_RECIPES.map((preset) => {
            const localizedPreset =
              t.presets[preset.id as keyof typeof t.presets] ?? {
                title: preset.titleJa,
                subtitle: preset.subtitleJa,
              };
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-scroll-btn ${
                  activePresetId === preset.id ? 'active' : ''
                }`}
                data-testid={`preset-btn-${preset.id}`}
                onClick={() => handleSelectPreset(preset.id)}
                title={localizedPreset.subtitle}
              >
                <strong>{localizedPreset.title}</strong>
                <small>{localizedPreset.subtitle}</small>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Interactive Opening Act (体験型チュートリアル・序幕バー) */}
      {tourState !== 'dismissed' && (
        <section
          className={`opening-act-banner ${
            tourState === 'completed' ? 'is-completed' : ''
          }`}
          aria-label="初陣・体験ガイド (Opening Act)"
          data-testid="opening-act-banner"
          data-tour-step={String(tourState)}
        >
          {currentStepData ? (
            <div className="opening-act-inner">
              <div className="opening-act-left">
                <span className="opening-act-badge">
                  {currentStepData.stepBadge}
                </span>
                <div className="opening-act-copy">
                  <strong>{currentStepData.title}</strong>
                  <span>{currentStepData.instruction}</span>
                </div>
              </div>
              <div className="opening-act-actions">
                {currentStepData.actionButtonLabel && (
                  <button
                    type="button"
                    className="opening-act-try-btn"
                    data-testid="opening-act-try-btn"
                    onClick={handleOpeningActQuickAction}
                  >
                    {currentStepData.actionButtonLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="opening-act-slides-btn"
                  onClick={() => {
                    setGuideInitialTab('manual');
                    setIsGuideOpen(true);
                  }}
                >
                  {t.openingAct.openSlidesBtn}
                </button>
                <button
                  type="button"
                  className="opening-act-skip-btn"
                  data-testid="opening-act-skip-btn"
                  onClick={() => {
                    tourStateRef.current = 'dismissed';
                    setTourState('dismissed');
                  }}
                >
                  ✕ {t.openingAct.skipBtn}
                </button>
              </div>
            </div>
          ) : (
            <div className="opening-act-inner">
              <div className="opening-act-left">
                <span className="opening-act-badge completed">💮 皆伝</span>
                <div className="opening-act-copy">
                  <strong>{t.openingAct.completedBadge}</strong>
                  <span>{t.openingAct.completedSub}</span>
                </div>
              </div>
              <div className="opening-act-actions">
                <button
                  type="button"
                  className="opening-act-slides-btn"
                  onClick={() => {
                    tourStateRef.current = 0;
                    setTourState(0);
                    handleResetDemo();
                  }}
                >
                  {t.openingAct.restartBtn}
                </button>
                <button
                  type="button"
                  className="opening-act-skip-btn"
                  onClick={() => {
                    tourStateRef.current = 'dismissed';
                    setTourState('dismissed');
                  }}
                >
                  ✕ {t.openingAct.skipBtn}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {isStudioOpen && (
        <section
          className="karakuri-studio-drawer"
          aria-label="からくり工房（JIDOKA安全検査付きブロック召喚）"
          data-testid="karakuri-studio-drawer"
        >
          <form className="studio-form" onSubmit={handleCraftSummon}>
            <div className="studio-header">
              <strong>
                {locale === 'ja'
                  ? '🧪 からくり工房 (JIDOKA 認定カスタムブロック召喚)'
                  : '🧪 Karakuri Craft Studio (JIDOKA Verified Block Summoner)'}
              </strong>
              <span>
                {locale === 'ja'
                  ? '外部AI通信ゼロ・ローカル型検査と無害化フィルタを通過した安全なブロックだけを召喚します。'
                  : 'Zero external AI/API calls — summons only safe blocks validated by local JIDOKA rules.'}
              </span>
            </div>
            <div className="studio-controls">
              <label className="studio-field">
                <span>{locale === 'ja' ? '型 (Type):' : 'Type:'}</span>
                <select
                  data-testid="craft-type-select"
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value as BlockType)}
                >
                  <option value="message">📜 文 (Message)</option>
                  <option value="filter">⛩️ 言霊フィルター (Filter)</option>
                  <option value="counter">🥁 太鼓カウンター (Counter)</option>
                  <option value="character">🎎 からくり人形 (Character)</option>
                  <option value="timer">🕰️ 刻・砂時計 (Timer)</option>
                  <option value="media-card">🏮 絵巻・舞台 (Media Card)</option>
                </select>
              </label>

              <label className="studio-field">
                <span>{locale === 'ja' ? '銘・セリフ (Label):' : 'Label:'}</span>
                <input
                  type="text"
                  data-testid="craft-label-input"
                  value={craftLabel}
                  maxLength={40}
                  onChange={(e) => setCraftLabel(e.target.value)}
                  placeholder="例: 千本桜からくり"
                />
              </label>

              {craftType === 'filter' && (
                <label className="studio-field">
                  <span>{locale === 'ja' ? '言霊調 (Style):' : 'Style:'}</span>
                  <select
                    data-testid="craft-style-select"
                    value={craftFilterStyle}
                    onChange={(e) =>
                      setCraftFilterStyle(e.target.value as FilterStyle)
                    }
                  >
                    <option value="miyabi">🌸 雅（和歌調）</option>
                    <option value="bushido">⚔️ 武士（熱血）</option>
                    <option value="kansai">🎉 祭（関西ノリ）</option>
                  </select>
                </label>
              )}

              {craftType === 'counter' && (
                <label className="studio-field">
                  <span>{locale === 'ja' ? '必要太鼓数:' : 'Hits:'}</span>
                  <input
                    type="number"
                    min={2}
                    max={5}
                    value={craftTargetCount}
                    onChange={(e) => setCraftTargetCount(Number(e.target.value))}
                  />
                </label>
              )}

              {craftType === 'timer' && (
                <label className="studio-field">
                  <span>{locale === 'ja' ? '秒数 (1-5s):' : 'Sec (1-5s):'}</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={craftDuration}
                    onChange={(e) => setCraftDuration(Number(e.target.value))}
                  />
                </label>
              )}

              <button
                type="submit"
                className="studio-summon-btn"
                data-testid="craft-summon-btn"
              >
                💮 {locale === 'ja' ? 'JIDOKA 検査して召喚' : 'JIDOKA Check & Summon'}
              </button>
            </div>
            {lastCraftReceipt && (
              <div
                className="studio-receipt"
                role="status"
                data-testid="craft-receipt"
              >
                {lastCraftReceipt}
              </div>
            )}
          </form>
        </section>
      )}

      {shareToast && (
        <div
          className="share-toast-banner"
          role="status"
          data-testid="share-toast-banner"
        >
          <span>{shareToast}</span>
          <button
            type="button"
            className="warning-dismiss-btn"
            onClick={() => setShareToast(null)}
          >
            {locale === 'ja' ? '閉じる' : 'Close'}
          </button>
        </div>
      )}

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
            {locale === 'ja' ? '閉じる' : 'Close'}
          </button>
        </div>
      )}

      <main className="workspace-grid">
        <aside className="toybox-panel" aria-label="からくり道具箱 (Block Palette)">
          <h2 className="panel-heading">{t.toybox.title}</h2>
          <p className="panel-help">{t.toybox.hint}</p>
          <div className="palette-list">
            <button
              type="button"
              className="palette-item palette-message"
              data-testid="add-message-btn"
              onClick={() => handleAddBlock('message')}
            >
              <span className="palette-icon" aria-hidden="true">📜</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Message (文・言霊)'
                    : '+ Message (Scroll Text)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '出力: sent (trigger)'
                    : 'Out: sent (trigger)'}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-character"
              data-testid="add-character-btn"
              onClick={() => handleAddBlock('character')}
            >
              <span className="palette-icon" aria-hidden="true">🎎</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Character (からくり人形)'
                    : '+ Character (Karakuri Puppet)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '入: jump / 出: landed (着地連鎖)'
                    : 'In: jump / Out: landed'}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-timer"
              data-testid="add-timer-btn"
              onClick={() => handleAddBlock('timer')}
            >
              <span className="palette-icon" aria-hidden="true">🕰️</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Timer (砂時計・3秒)'
                    : '+ Timer (3s Hourglass)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '入: start / 出: elapsed'
                    : 'In: start / Out: elapsed'}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-media"
              data-testid="add-media-btn"
              onClick={() => handleAddBlock('media-card')}
            >
              <span className="palette-icon" aria-hidden="true">🏮</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Media Card (絵巻舞台)'
                    : '+ Media Card (Lantern Stage)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '入力: play (演舞切替)'
                    : 'In: play (Toggle Stage)'}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-filter"
              data-testid="add-filter-btn"
              onClick={() => handleAddBlock('filter')}
            >
              <span className="palette-icon" aria-hidden="true">⛩️</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Filter (言霊変換)'
                    : '+ Filter (Kotodama Style)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '入: in → 出: out (雅/武士/祭)'
                    : 'In: in → Out: out (Poetic/Samurai)'}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="palette-item palette-counter"
              data-testid="add-counter-btn"
              onClick={() => handleAddBlock('counter')}
            >
              <span className="palette-icon" aria-hidden="true">🥁</span>
              <span className="palette-text">
                <strong>
                  {locale === 'ja'
                    ? '+ Counter (三連大太鼓)'
                    : '+ Counter (3-Hit Taiko Drum)'}
                </strong>
                <small>
                  {locale === 'ja'
                    ? '入: hit (3打) → 出: combo'
                    : 'In: hit (3x) → Out: combo'}
                </small>
              </span>
            </button>
          </div>

          <section className="event-log-section" aria-label="からくり過去帳 (Event Log)">
            <h2 className="panel-heading">{t.toybox.eventLogTitle}</h2>
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
          filterState={filterState}
          counterState={counterState}
          timerSignals={timerSignals}
          activeEdgeIds={activeEdgeIds}
          onSendMessage={handleSendMessage}
          onTimerElapsed={handleTimerElapsed}
          onChangeFilterStyle={handleChangeFilterStyle}
          onConnect={handleConnect}
          onDisconnectEdge={handleDisconnectEdge}
          onRemoveNode={handleRemoveNode}
          onMoveNode={handleMoveNode}
        />
      </main>

      <GuideModal
        isOpen={isGuideOpen}
        locale={locale}
        initialTab={guideInitialTab}
        onClose={() => setIsGuideOpen(false)}
        onStartOpeningAct={() => {
          tourStateRef.current = 0;
          setTourState(0);
          handleResetDemo();
        }}
        onLoadPresetAndClose={(presetId) => {
          handleSelectPreset(presetId);
          setIsGuideOpen(false);
        }}
      />
    </div>
  );
};
