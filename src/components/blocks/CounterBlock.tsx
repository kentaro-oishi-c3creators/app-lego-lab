import React from 'react';
import { BlockNode } from '../../domain/types';

export interface CounterRuntimeState {
  currentCount: number;
  comboCount: number;
  isTriggered: boolean;
}

export interface CounterBlockProps {
  node: BlockNode;
  runtime?: CounterRuntimeState;
}

export const CounterBlock: React.FC<CounterBlockProps> = ({ node, runtime }) => {
  const targetCount = Math.max(2, Math.min(5, node.data.targetCount ?? 3));
  const currentCount = runtime?.currentCount ?? 0;
  const comboCount = runtime?.comboCount ?? 0;
  const isTriggered = runtime?.isTriggered ?? false;

  const drums = Array.from({ length: targetCount }, (_, i) => i < currentCount);

  return (
    <div
      className={`block-body counter-block-body ${isTriggered ? 'is-combo-triggered' : ''}`}
      data-testid={`counter-body-${node.id}`}
      data-current-count={currentCount}
      data-target-count={targetCount}
      data-combo-count={comboCount}
    >
      <div
        className="counter-stage"
        role="status"
        aria-live="polite"
        aria-label={`太鼓カウンター: ${currentCount} / ${targetCount} 打 (奥義発動 ${comboCount} 回)`}
      >
        <div className="taiko-drums-row" aria-hidden="true">
          {drums.map((filled, idx) => (
            <span
              key={idx}
              className={`taiko-drum-dot ${filled ? 'filled' : ''} ${
                isTriggered ? 'combo-burst' : ''
              }`}
            >
              {filled ? '🥁' : '⚪'}
            </span>
          ))}
        </div>
        <span className="status-pill" data-testid={`counter-status-${node.id}`}>
          {isTriggered
            ? '🎇 満願成就・奥義発動！'
            : `残り ${targetCount - currentCount} 打 (${currentCount}/${targetCount})`}
        </span>
      </div>
      <div className="block-metric" data-testid={`counter-combos-${node.id}`}>
        奥義発動回数 (Combos): <strong>{comboCount}</strong>
      </div>
    </div>
  );
};
