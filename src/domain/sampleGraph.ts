import sampleStoryRaw from '../../fixtures/sample-story.json';
import { sanitizeGraph } from './graph';
import { GraphState } from './types';

export interface PresetDescriptor {
  id: string;
  titleJa: string;
  subtitleJa: string;
  create: () => GraphState;
}

export function createSampleGraph(): GraphState {
  return sanitizeGraph(sampleStoryRaw);
}

export function createEmptyGraph(): GraphState {
  return {
    schemaVersion: 1,
    name: '白紙の絵巻 (Empty Canvas)',
    nodes: [],
    edges: [],
  };
}

/**
 * 弐ノ巻：からくり五段ピタゴラ連鎖
 * Message -> Filter(雅) -> Character(舞・着地連鎖) -> Timer(2秒刻) -> MediaCard(絵巻開演)
 */
export function createKarakuriChainGraph(): GraphState {
  return sanitizeGraph({
    schemaVersion: 1,
    name: '弐ノ巻：からくり五段ピタゴラ連鎖',
    nodes: [
      {
        id: 'msg-1',
        type: 'message',
        position: { x: 32, y: 12 },
        data: { label: 'いざ開演！' },
      },
      {
        id: 'filter-1',
        type: 'filter',
        position: { x: 326, y: 12 },
        data: { label: '雅（みやび）言霊', filterStyle: 'miyabi' },
      },
      {
        id: 'char-1',
        type: 'character',
        position: { x: 626, y: 12 },
        data: { label: 'からくり獅子舞' },
      },
      {
        id: 'timer-1',
        type: 'timer',
        position: { x: 180, y: 205 },
        data: { label: '二秒の砂時計', durationSeconds: 2 },
      },
      {
        id: 'media-1',
        type: 'media-card',
        position: { x: 520, y: 205 },
        data: { label: '花鳥風月・祭囃子' },
      },
    ],
    edges: [
      {
        id: 'edge-k1',
        from: { nodeId: 'msg-1', portId: 'sent' },
        to: { nodeId: 'filter-1', portId: 'in' },
      },
      {
        id: 'edge-k2',
        from: { nodeId: 'filter-1', portId: 'out' },
        to: { nodeId: 'char-1', portId: 'jump' },
      },
      {
        id: 'edge-k3',
        from: { nodeId: 'char-1', portId: 'landed' },
        to: { nodeId: 'timer-1', portId: 'start' },
      },
      {
        id: 'edge-k4',
        from: { nodeId: 'timer-1', portId: 'elapsed' },
        to: { nodeId: 'media-1', portId: 'play' },
      },
    ],
  });
}

/**
 * 参ノ巻：三連太鼓の必殺奥義
 * Message -> Counter(3回太鼓) -> Character + MediaCard 同時発動
 */
export function createTaikoComboGraph(): GraphState {
  return sanitizeGraph({
    schemaVersion: 1,
    name: '参ノ巻：三連太鼓の必殺奥義',
    nodes: [
      {
        id: 'msg-1',
        type: 'message',
        position: { x: 40, y: 100 },
        data: { label: 'ワッショイ！' },
      },
      {
        id: 'counter-1',
        type: 'counter',
        position: { x: 336, y: 100 },
        data: { label: '三連大太鼓', targetCount: 3 },
      },
      {
        id: 'char-1',
        type: 'character',
        position: { x: 636, y: 10 },
        data: { label: '歌舞伎見得人形' },
      },
      {
        id: 'media-1',
        type: 'media-card',
        position: { x: 636, y: 202 },
        data: { label: '千両花火・大団円' },
      },
    ],
    edges: [
      {
        id: 'edge-t1',
        from: { nodeId: 'msg-1', portId: 'sent' },
        to: { nodeId: 'counter-1', portId: 'hit' },
      },
      {
        id: 'edge-t2',
        from: { nodeId: 'counter-1', portId: 'combo' },
        to: { nodeId: 'char-1', portId: 'jump' },
      },
      {
        id: 'edge-t3',
        from: { nodeId: 'counter-1', portId: 'combo' },
        to: { nodeId: 'media-1', portId: 'play' },
      },
    ],
  });
}

/**
 * 肆ノ巻：千本桜・一斉演舞
 */
export function createSenbonzakuraGraph(): GraphState {
  return sanitizeGraph({
    schemaVersion: 1,
    name: '肆ノ巻：千本桜・一斉演舞',
    nodes: [
      {
        id: 'msg-1',
        type: 'message',
        position: { x: 36, y: 100 },
        data: { label: '春風よ吹け！' },
      },
      {
        id: 'filter-1',
        type: 'filter',
        position: { x: 326, y: 100 },
        data: { label: '熱血武士モード', filterStyle: 'bushido' },
      },
      {
        id: 'char-1',
        type: 'character',
        position: { x: 630, y: 10 },
        data: { label: '右大臣人形' },
      },
      {
        id: 'char-2',
        type: 'character',
        position: { x: 630, y: 200 },
        data: { label: '左大臣人形' },
      },
      {
        id: 'media-1',
        type: 'media-card',
        position: { x: 326, y: 245 },
        data: { label: '桜吹雪・雅楽舞台' },
      },
    ],
    edges: [
      {
        id: 'edge-s1',
        from: { nodeId: 'msg-1', portId: 'sent' },
        to: { nodeId: 'filter-1', portId: 'in' },
      },
      {
        id: 'edge-s2',
        from: { nodeId: 'filter-1', portId: 'out' },
        to: { nodeId: 'char-1', portId: 'jump' },
      },
      {
        id: 'edge-s3',
        from: { nodeId: 'filter-1', portId: 'out' },
        to: { nodeId: 'char-2', portId: 'jump' },
      },
      {
        id: 'edge-s4',
        from: { nodeId: 'filter-1', portId: 'out' },
        to: { nodeId: 'media-1', portId: 'play' },
      },
    ],
  });
}

export const PRESET_RECIPES: readonly PresetDescriptor[] = [
  {
    id: 'poc0-basic',
    titleJa: '📜 壱ノ巻：基本の二対',
    subtitleJa: 'Message → Character / Timer → Media',
    create: createSampleGraph,
  },
  {
    id: 'karakuri-chain',
    titleJa: '🎎 弐ノ巻：からくり五段連鎖',
    subtitleJa: '文 → 言霊 → 人形 → 砂時計 → 舞台',
    create: createKarakuriChainGraph,
  },
  {
    id: 'taiko-combo',
    titleJa: '🥁 参ノ巻：三連太鼓の奥義',
    subtitleJa: '3回叩くと人形と花火が同時発動！',
    create: createTaikoComboGraph,
  },
  {
    id: 'senbonzakura',
    titleJa: '🌸 肆ノ巻：千本桜・一斉演舞',
    subtitleJa: '1つの文から3つの舞台が一斉に舞う',
    create: createSenbonzakuraGraph,
  },
];

/**
 * Pure UTF-8 safe Base64URL encoder for URL hash sharing (#emaki=...).
 */
export function encodeGraphToHash(graph: GraphState): string {
  const json = JSON.stringify(graph);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `#emaki=${base64}`;
}

/**
 * Pure UTF-8 safe Base64URL decoder with sanitizeGraph protection.
 * Returns null if the hash is empty or malformed.
 */
export function decodeGraphFromHash(hash: string): GraphState | null {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleaned.startsWith('emaki=')) {
    return null;
  }
  const encoded = cleaned.slice('emaki='.length).trim();
  if (!encoded) {
    return null;
  }
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    const graph = sanitizeGraph(parsed);
    if (graph.nodes.length === 0 && (!Array.isArray(parsed.nodes) || parsed.nodes.length > 0)) {
      return null;
    }
    return graph;
  } catch {
    return null;
  }
}
