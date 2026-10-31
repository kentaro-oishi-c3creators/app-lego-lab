import React, { useEffect, useRef, useState } from 'react';
import { BlockNode } from '../../domain/types';

export interface TimerBlockProps {
  node: BlockNode;
  onElapsed: (nodeId: string) => void;
  onCancelLog?: (nodeId: string) => void;
}

export const TimerBlock: React.FC<TimerBlockProps> = ({ node, onElapsed }) => {
  const durationSeconds = Math.max(1, Math.min(3, node.data.durationSeconds ?? 3));
  const [isRunning, setIsRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(durationSeconds * 1000);
  const [completedCount, setCompletedCount] = useState(0);

  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredRef = useRef<boolean>(false);

  const clearTimers = () => {
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Clean up on unmount / block deletion so deleted timers never fire (Gate G05)
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const handleStart = () => {
    if (isRunning) {
      return;
    }
    clearTimers();
    hasFiredRef.current = false;
    const totalMs = durationSeconds * 1000;
    setIsRunning(true);
    setRemainingMs(totalMs);

    const startedAt = Date.now();
    intervalIdRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(0, totalMs - elapsed);
      setRemainingMs(nextRemaining);
    }, 100);

    timerIdRef.current = setTimeout(() => {
      clearTimers();
      if (!hasFiredRef.current) {
        hasFiredRef.current = true;
        setIsRunning(false);
        setRemainingMs(0);
        setCompletedCount((c) => c + 1);
        onElapsedRef.current(node.id);
      }
    }, totalMs);
  };

  const secondsDisplay = isRunning
    ? `${(remainingMs / 1000).toFixed(1)}s`
    : `${durationSeconds}s`;

  return (
    <div
      className={`block-body timer-block-body ${isRunning ? 'is-running' : ''}`}
      data-testid={`timer-body-${node.id}`}
      data-running={isRunning ? 'true' : 'false'}
      data-completed-count={completedCount}
    >
      <div className="timer-display" role="status" aria-live="polite">
        <span className="timer-icon" aria-hidden="true">
          {isRunning ? '⏳' : '⏱️'}
        </span>
        <span className="timer-countdown" data-testid={`timer-countdown-${node.id}`}>
          {secondsDisplay}
        </span>
        <span className="status-pill" data-testid={`timer-status-${node.id}`}>
          {isRunning ? 'Counting (計測中)' : `Ready (${durationSeconds}秒)`}
        </span>
      </div>
      <div className="timer-controls">
        <button
          type="button"
          className="action-btn timer-start-btn"
          data-testid={`start-timer-btn-${node.id}`}
          disabled={isRunning}
          aria-label={`${durationSeconds}秒タイマーを開始 (Start Timer)`}
          onClick={handleStart}
        >
          {isRunning ? '⏳ Running...' : `▶️ Start Timer (${durationSeconds}s)`}
        </button>
      </div>
    </div>
  );
};
