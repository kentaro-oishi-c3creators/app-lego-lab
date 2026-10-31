import React from 'react';
import { BlockNode } from '../../domain/types';

export interface MediaCardRuntimeState {
  isPlaying: boolean;
  toggleCount: number;
}

export interface MediaCardBlockProps {
  node: BlockNode;
  runtime?: MediaCardRuntimeState;
}

export const MediaCardBlock: React.FC<MediaCardBlockProps> = ({ node, runtime }) => {
  const label = node.data.label || 'Rainbow preview';
  const isPlaying = runtime?.isPlaying ?? false;
  const toggleCount = runtime?.toggleCount ?? 0;

  return (
    <div
      className={`block-body media-block-body ${isPlaying ? 'is-playing' : ''}`}
      data-testid={`media-body-${node.id}`}
      data-playing={isPlaying ? 'true' : 'false'}
      data-toggle-count={toggleCount}
    >
      <div
        className={`media-preview-screen ${isPlaying ? 'media-playing' : 'media-paused'}`}
        role="status"
        aria-live="polite"
        aria-label={`${label} のモック再生状態: ${isPlaying ? '再生中' : '停止中'}`}
      >
        <div className="media-visual" aria-hidden="true">
          {isPlaying ? '🌈🎶' : '🖼️⏸️'}
        </div>
        <div className="media-info">
          <strong>{label}</strong>
          <span className="status-pill" data-testid={`media-status-${node.id}`}>
            {isPlaying ? 'PLAYING (モック再生中)' : 'PAUSED (待機中)'}
          </span>
        </div>
        <div className="media-progress-track" aria-hidden="true">
          <div className={`media-progress-bar ${isPlaying ? 'active' : ''}`} />
        </div>
      </div>
      <div className="block-metric" data-testid={`media-toggles-${node.id}`}>
        反応回数 (Toggles): <strong>{toggleCount}</strong>
      </div>
    </div>
  );
};
