import React from 'react';
import { BlockNode } from '../../domain/types';

export interface MessageBlockProps {
  node: BlockNode;
  onSend: (nodeId: string) => void;
}

export const MessageBlock: React.FC<MessageBlockProps> = ({ node, onSend }) => {
  const label = node.data.label || 'Hello!';

  return (
    <div className="block-body message-block-body" data-testid={`message-body-${node.id}`}>
      <div className="message-bubble" aria-label={`メッセージ内容: ${label}`}>
        <span className="message-quote">“{label}”</span>
      </div>
      <button
        type="button"
        className="action-btn send-btn"
        data-testid={`send-btn-${node.id}`}
        aria-label={`${label} を送信 (Send Message)`}
        onClick={() => onSend(node.id)}
      >
        📨 Send (送信)
      </button>
    </div>
  );
};
