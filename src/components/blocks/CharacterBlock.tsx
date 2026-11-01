import React from 'react';
import { BlockNode } from '../../domain/types';

export interface CharacterRuntimeState {
  isJumping: boolean;
  jumpCount: number;
  lastSpeechText?: string;
}

export interface CharacterBlockProps {
  node: BlockNode;
  runtime?: CharacterRuntimeState;
}

export const CharacterBlock: React.FC<CharacterBlockProps> = ({ node, runtime }) => {
  const label = node.data.label || 'Happy bot';
  const isJumping = runtime?.isJumping ?? false;
  const jumpCount = runtime?.jumpCount ?? 0;
  const speechText = runtime?.lastSpeechText;

  return (
    <div
      className={`block-body character-block-body ${isJumping ? 'is-jumping' : ''}`}
      data-testid={`character-body-${node.id}`}
      data-jumping={isJumping ? 'true' : 'false'}
      data-jump-count={jumpCount}
    >
      {speechText && (
        <div
          className={`character-speech-bubble ${isJumping ? 'speech-active' : ''}`}
          data-testid={`character-speech-${node.id}`}
        >
          {speechText}
        </div>
      )}
      <div
        className={`character-stage ${isJumping ? 'character-jumping' : 'character-idle'}`}
        role="status"
        aria-live="polite"
        aria-label={`${label} の状態: ${isJumping ? 'ジャンプ中' : '待機中'} (累計 ${jumpCount} 回)`}
      >
        <div className="character-avatar" aria-hidden="true">
          {isJumping ? '🎎🌸' : '🎎'}
        </div>
        <div className="character-status-text">
          <strong>{label}</strong>
          <span className="status-pill" data-testid={`character-status-${node.id}`}>
            {isJumping ? 'JUMP! (ジャンプ中!)' : 'Idle (待機中)'}
          </span>
        </div>
      </div>
      <div className="block-metric" data-testid={`character-jumps-${node.id}`}>
        ジャンプ回数 (Jumps): <strong>{jumpCount}</strong>
      </div>
    </div>
  );
};
