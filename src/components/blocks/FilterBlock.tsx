import React from 'react';
import { transformKotodama } from '../../domain/graph';
import { BlockNode, FilterStyle } from '../../domain/types';

export interface FilterRuntimeState {
  isPulsing: boolean;
  lastOutputText?: string;
  passCount: number;
}

export interface FilterBlockProps {
  node: BlockNode;
  runtime?: FilterRuntimeState;
  onChangeStyle: (nodeId: string, style: FilterStyle) => void;
}

const STYLE_LABELS: Record<FilterStyle, { badge: string; desc: string }> = {
  miyabi: { badge: '🌸 雅（和歌調）', desc: '花鳥風月〜かな✨' },
  bushido: { badge: '⚔️ 武士（熱血）', desc: 'いざ参らん！〜でござる🔥' },
  kansai: { badge: '🎉 祭（関西ノリ）', desc: 'めっちゃ〜やん！🏮' },
};

export const FilterBlock: React.FC<FilterBlockProps> = ({
  node,
  runtime,
  onChangeStyle,
}) => {
  const currentStyle: FilterStyle = node.data.filterStyle ?? 'miyabi';
  const isPulsing = runtime?.isPulsing ?? false;
  const passCount = runtime?.passCount ?? 0;
  const previewText =
    runtime?.lastOutputText ?? transformKotodama('Hello!', currentStyle);

  return (
    <div
      className={`block-body filter-block-body ${isPulsing ? 'is-pulsing' : ''}`}
      data-testid={`filter-body-${node.id}`}
      data-filter-style={currentStyle}
      data-pass-count={passCount}
    >
      <div className="filter-style-selector" role="group" aria-label="言霊変換スタイル選択">
        {(['miyabi', 'bushido', 'kansai'] as FilterStyle[]).map((styleKey) => (
          <button
            key={styleKey}
            type="button"
            className={`style-chip-btn ${currentStyle === styleKey ? 'active' : ''}`}
            data-testid={`filter-style-${node.id}-${styleKey}`}
            onClick={() => onChangeStyle(node.id, styleKey)}
          >
            {STYLE_LABELS[styleKey].badge}
          </button>
        ))}
      </div>
      <div className="kotodama-preview" data-testid={`filter-preview-${node.id}`}>
        <small>言霊プレビュー:</small>
        <span>{previewText}</span>
      </div>
      <div className="block-metric" data-testid={`filter-count-${node.id}`}>
        変換回数 (Filtered): <strong>{passCount}</strong>
      </div>
    </div>
  );
};
