import React from 'react';
import { Locale } from '../domain/i18n';
import { soundEngine } from '../domain/soundEngine';
import { BlockType, FilterStyle, GraphState } from '../domain/types';
import { CharacterRuntimeState } from './blocks/CharacterBlock';
import { CounterRuntimeState } from './blocks/CounterBlock';
import { FilterRuntimeState } from './blocks/FilterBlock';
import { MediaCardRuntimeState } from './blocks/MediaCardBlock';

export interface RelayStepItem {
  stepNumber: number;
  nodeId: string;
  blockType: BlockType;
  icon: string;
  title: string;
  actionText: string;
  soundLabel: string;
  status: 'pending' | 'active' | 'done' | 'blocked';
}

export interface KarakuriTheaterStageProps {
  graph: GraphState;
  locale: Locale;
  soundEnabled: boolean;
  onToggleSound: () => void;
  characterState: Record<string, CharacterRuntimeState>;
  mediaState: Record<string, MediaCardRuntimeState>;
  filterState: Record<string, FilterRuntimeState>;
  counterState: Record<string, CounterRuntimeState>;
  activeNodeIds: ReadonlySet<string>;
  relaySteps: RelayStepItem[];
  liveNarration: string | null;
  lastActionStatus: 'idle' | 'running' | 'completed' | 'disconnected';
  lastSentText: string | null;
  lastTransformedText: string | null;
  lastFilterStyle: FilterStyle | null;
  isTimerCounting: boolean;
  onPlayPrimaryAction: () => void;
}

export const KarakuriTheaterStage: React.FC<KarakuriTheaterStageProps> = ({
  graph,
  locale,
  soundEnabled,
  onToggleSound,
  characterState,
  mediaState,
  filterState,
  counterState,
  activeNodeIds,
  relaySteps,
  liveNarration,
  lastActionStatus,
  lastSentText,
  lastTransformedText,
  lastFilterStyle,
  isTimerCounting,
  onPlayPrimaryAction,
}) => {
  // Aggregate stage state from all blocks in the current graph
  const characters = graph.nodes.filter((n) => n.type === 'character');
  const mediaCards = graph.nodes.filter((n) => n.type === 'media-card');
  const counters = graph.nodes.filter((n) => n.type === 'counter');
  const filters = graph.nodes.filter((n) => n.type === 'filter');

  const anyCharacterJumping = characters.some(
    (c) => characterState[c.id]?.isJumping
  );
  const totalJumpCount = characters.reduce(
    (acc, c) => acc + (characterState[c.id]?.jumpCount ?? 0),
    0
  );
  const latestSpeech =
    characters
      .map((c) => characterState[c.id]?.lastSpeechText)
      .find((txt) => Boolean(txt)) ??
    lastTransformedText ??
    lastSentText;

  const anyStagePlaying = mediaCards.some((m) => mediaState[m.id]?.isPlaying);
  const activeMediaCount = mediaCards.filter(
    (m) => mediaState[m.id]?.isPlaying
  ).length;

  const primaryCounter = counters[0];
  const counterRuntime = primaryCounter
    ? counterState[primaryCounter.id]
    : undefined;
  const counterTarget = primaryCounter?.data.targetCount ?? 3;

  const primaryFilter = filters[0];
  const filterRuntime = primaryFilter ? filterState[primaryFilter.id] : undefined;

  const hasAnyEdges = graph.edges.length > 0;

  return (
    <section
      className={`karakuri-theater-stage status-${lastActionStatus} ${
        anyStagePlaying ? 'is-finale-playing' : ''
      }`}
      aria-label={
        locale === 'ja'
          ? 'からくり実演シアター（アニメーション舞台）'
          : 'Karakuri Live Animation Stage'
      }
      data-testid="karakuri-theater-stage"
    >
      {/* Top Curtain Header */}
      <div className="theater-header">
        <div className="theater-title-group">
          <span className="theater-curtain-badge">
            🎭 {locale === 'ja' ? '表舞台：からくり実演シアター' : 'LIVE STAGE'}
          </span>
          <div className="theater-title-copy">
            <h2>
              {locale === 'ja'
                ? '目で見て・音で聴いてわかる！リアルタイム演舞ステージ'
                : 'Watch & Hear Your Contraption Come Alive!'}
            </h2>
            <p>
              {locale === 'ja'
                ? '下の「配線キャンバス」で繋いだ水引の通りに、文・太鼓・人形・花火が順番にアニメーション＆和楽器サウンドで連動します'
                : 'Your wiring below drives this live animated puppet & fireworks stage with synthesized Japanese instruments'}
            </p>
          </div>
        </div>

        <div className="theater-controls">
          <button
            type="button"
            className="theater-play-cta-btn"
            data-testid="theater-play-btn"
            onClick={onPlayPrimaryAction}
          >
            🎬{' '}
            {locale === 'ja'
              ? '舞台で実演スタート！(送信)'
              : 'Play Stage Action!'}
          </button>

          <button
            type="button"
            className={`theater-sound-toggle-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
            data-testid="sound-toggle-btn"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
          >
            {soundEnabled
              ? locale === 'ja'
                ? '🔊 和楽器効果音 ON'
                : '🔊 Sound ON'
              : locale === 'ja'
                ? '🔇 効果音 OFF'
                : '🔇 Muted'}
          </button>

          {/* Mini Soundboard so users can test instruments anytime */}
          <div
            className="theater-soundboard"
            aria-label={locale === 'ja' ? '和楽器サウンド試聴' : 'Instrument Sound Test'}
          >
            <button
              type="button"
              className="sound-chip-btn"
              title={locale === 'ja' ? '琴の音を鳴らす' : 'Play Koto'}
              onClick={() => soundEngine.playMessageSend()}
            >
              🎵 {locale === 'ja' ? '琴' : 'Koto'}
            </button>
            <button
              type="button"
              className="sound-chip-btn"
              title={locale === 'ja' ? '小鼓の音を鳴らす' : 'Play Tsuzumi'}
              onClick={() => soundEngine.playCharacterJump()}
            >
              🥁 {locale === 'ja' ? '小鼓' : 'Tsuzumi'}
            </button>
            <button
              type="button"
              className="sound-chip-btn"
              title={locale === 'ja' ? '和太鼓の音を鳴らす' : 'Play Taiko'}
              onClick={() => soundEngine.playTaikoHit(true)}
            >
              🏮 {locale === 'ja' ? '大太鼓' : 'Taiko'}
            </button>
            <button
              type="button"
              className="sound-chip-btn"
              title={locale === 'ja' ? '打ち上げ花火の音を鳴らす' : 'Play Fireworks'}
              onClick={() => soundEngine.playStageFinale(true)}
            >
              🎆 {locale === 'ja' ? '花火' : 'Fireworks'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Step-by-Step Relay Banner (今何が起きているかの実況テロップ) */}
      <div
        className={`theater-narration-bar status-${lastActionStatus}`}
        data-testid="theater-narration-bar"
      >
        <span className="narration-label">
          {lastActionStatus === 'running'
            ? locale === 'ja'
              ? '⚡ 連鎖実行中'
              : '⚡ CHAIN RUNNING'
            : lastActionStatus === 'disconnected'
              ? locale === 'ja'
                ? '✂️ 水引切断中'
                : '✂️ DISCONNECTED'
              : lastActionStatus === 'completed'
                ? locale === 'ja'
                  ? '💮 連鎖完了'
                  : '💮 CHAIN DONE'
                : locale === 'ja'
                  ? '🎬 実況ガイド'
                  : '🎬 STAGE GUIDE'}
        </span>
        <strong className="narration-text">
          {liveNarration ??
            (locale === 'ja'
              ? '右上の「🎬 舞台で実演スタート！」または下のブロックの「📨 Send (送信)」を押すと、順番に光と音で連鎖します！'
              : 'Press "🎬 Play Stage Action!" or "📨 Send" on a block below to watch the step-by-step animated chain!')}
        </strong>
      </div>

      {/* Step-by-Step Visual Relay Pipeline */}
      {relaySteps.length > 0 && (
        <div
          className="theater-relay-pipeline"
          data-testid="theater-relay-pipeline"
          aria-label="連鎖ステップ進行状況"
        >
          {relaySteps.map((step, idx) => (
            <React.Fragment key={`${step.nodeId}-${step.stepNumber}`}>
              <div
                className={`relay-step-card relay-status-${step.status}`}
                data-testid={`relay-step-${step.stepNumber}`}
              >
                <div className="relay-step-top">
                  <span className="relay-step-num">STEP {step.stepNumber}</span>
                  <span className="relay-sound-pill">{step.soundLabel}</span>
                </div>
                <div className="relay-step-main">
                  <span className="relay-step-icon">{step.icon}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <small>{step.actionText}</small>
                  </div>
                </div>
              </div>
              {idx < relaySteps.length - 1 && (
                <div
                  className={`relay-connector-arrow ${
                    step.status === 'done' || step.status === 'active'
                      ? 'arrow-lit'
                      : ''
                  }`}
                  aria-hidden="true"
                >
                  <span>━━⚡━━▶</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main 3-Zone Animated Stage (Left: Scroll/Taiko, Center: Puppet Stage, Right: Fireworks Finale) */}
      <div className="theater-stage-grid">
        {/* Zone 1: Kotodama Scroll & Taiko Drum */}
        <div
          className={`stage-zone stage-zone-source ${
            activeNodeIds.has('msg-1') ||
            activeNodeIds.has('filter-1') ||
            activeNodeIds.has('counter-1')
              ? 'zone-spotlight'
              : ''
          }`}
        >
          <div className="stage-zone-label">
            📜 {locale === 'ja' ? '壱ノ段：言霊・太鼓の発信' : 'Act I: Kotodama & Taiko'}
          </div>

          <div className="animated-scroll-box">
            <div className="scroll-roller scroll-roller-left" />
            <div className="scroll-paper">
              <span className="scroll-caption">
                {lastTransformedText
                  ? locale === 'ja'
                    ? `⛩️ 言霊変身 (${lastFilterStyle ?? '雅'})`
                    : `⛩️ Transformed (${lastFilterStyle ?? 'miyabi'})`
                  : locale === 'ja'
                    ? '📨 発信された文'
                    : '📨 Sent Message'}
              </span>
              <div className="scroll-calligraphy" key={latestSpeech ?? 'init'}>
                {latestSpeech ?? (locale === 'ja' ? '「いざ、実演！」' : '"Ready to Play!"')}
              </div>
              {filterRuntime?.lastOutputText && (
                <span className="scroll-sfx-badge">✨ シャラン♪ (神楽鈴)</span>
              )}
            </div>
            <div className="scroll-roller scroll-roller-right" />
          </div>

          {primaryCounter && (
            <div
              className={`animated-taiko-widget ${
                counterRuntime?.isTriggered ? 'taiko-combo-burst' : ''
              }`}
            >
              <div className="taiko-drum-svg-wrap">
                <svg viewBox="0 0 120 74" className="taiko-stage-svg">
                  {/* Shockwave rings */}
                  {(counterRuntime?.currentCount ?? 0) > 0 ||
                  counterRuntime?.isTriggered ? (
                    <circle
                      cx="60"
                      cy="38"
                      r="32"
                      className="taiko-shockwave-ring"
                    />
                  ) : null}
                  {/* Drum body */}
                  <ellipse cx="60" cy="38" rx="28" ry="24" fill="#991b1b" stroke="#d4af37" strokeWidth="2.5" />
                  <ellipse cx="60" cy="38" rx="20" ry="18" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
                  {/* Tomoe crest */}
                  <circle cx="60" cy="38" r="6" fill="#1c120c" />
                  {/* Animated Bachi drumsticks */}
                  <line
                    x1="18"
                    y1="14"
                    x2="46"
                    y2="34"
                    stroke="#fde68a"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="taiko-bachi-left"
                  />
                  <line
                    x1="102"
                    y1="14"
                    x2="74"
                    y2="34"
                    stroke="#fde68a"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="taiko-bachi-right"
                  />
                </svg>
              </div>
              <div className="taiko-stage-info">
                <strong>
                  🥁{' '}
                  {counterRuntime?.isTriggered
                    ? locale === 'ja'
                      ? '🎇 満願成就！ドドーン！！'
                      : '🎇 3-HIT COMBO FIRED!'
                    : locale === 'ja'
                      ? `太鼓連打: ${counterRuntime?.currentCount ?? 0} / ${counterTarget} 打`
                      : `Drum Hits: ${counterRuntime?.currentCount ?? 0} / ${counterTarget}`}
                </strong>
                <small>
                  {locale === 'ja'
                    ? `あと ${Math.max(
                        0,
                        counterTarget - (counterRuntime?.currentCount ?? 0)
                      )} 回 Send を押すと奥義発動！`
                    : `Hit Send ${Math.max(
                        0,
                        counterTarget - (counterRuntime?.currentCount ?? 0)
                      )} more time(s) for Combo!`}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Center Stage — Karakuri Puppet Performance */}
        <div
          className={`stage-zone stage-zone-puppet ${
            anyCharacterJumping ? 'puppet-is-jumping' : ''
          } ${lastActionStatus === 'disconnected' ? 'puppet-is-disconnected' : ''}`}
        >
          <div className="stage-zone-label">
            🎎 {locale === 'ja' ? '弐ノ段：からくり人形の檜舞台' : 'Act II: Karakuri Puppet Stage'}
          </div>

          <div className="puppet-stage-viewport">
            {/* Hanging Chochin Lanterns */}
            <div className="stage-lanterns-row" aria-hidden="true">
              <span className="stage-lantern">🏮</span>
              <span className="stage-mizuhiki-beam">
                {lastActionStatus === 'disconnected' || !hasAnyEdges
                  ? '✂️ ── ✕ ── (水引切断中)'
                  : anyCharacterJumping
                    ? '⚡━━━🟡━━━▶ 着弾！'
                    : '🎐 ━━━━━━━ (水引接続中)'}
              </span>
              <span className="stage-lantern">🏮</span>
            </div>

            {/* Speech Bubble or Disconnected Notice */}
            {lastActionStatus === 'disconnected' ? (
              <div
                className="stage-disconnected-callout"
                data-testid="stage-disconnected-callout"
              >
                <strong>
                  ✂️{' '}
                  {locale === 'ja'
                    ? '水引が切れているため、人形に言霊が届きません！'
                    : 'Mizuhiki cord is cut — signal stopped before reaching the puppet!'}
                </strong>
                <span>
                  {locale === 'ja'
                    ? '💡 上部の「↩️ Undo (戻す)」を押すと水引が復活して再び踊り出します'
                    : '💡 Click "↩️ Undo" in the top bar to restore the cord and make it dance again!'}
                </span>
              </div>
            ) : (
              latestSpeech && (
                <div className="stage-puppet-speech" key={ totalJumpCount }>
                  <span className="speech-quote">{latestSpeech}</span>
                  {anyCharacterJumping && (
                    <span className="sfx-pon-badge">🥁 ポンッ！！</span>
                  )}
                </div>
              )
            )}

            {/* Expressive SVG Karakuri Puppet */}
            <div className="puppet-svg-container">
              <svg
                viewBox="0 0 180 135"
                className={`karakuri-puppet-svg ${
                  anyCharacterJumping ? 'svg-jumping' : ''
                }`}
                aria-label="からくり人形アニメーション"
              >
                {/* Stage Wooden Floor */}
                <rect
                  x="15"
                  y="114"
                  width="150"
                  height="12"
                  rx="4"
                  fill="#78350f"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                />
                {/* Jump shadow */}
                <ellipse
                  cx="90"
                  cy="114"
                  rx={anyCharacterJumping ? '16' : '28'}
                  ry="5"
                  fill="rgba(0,0,0,0.45)"
                />

                {/* Karakuri Puppet Group (moves up and tilts when jumping!) */}
                <g className="puppet-body-group">
                  {/* Kimono Robe */}
                  <path
                    d="M 64 62 L 116 62 L 126 112 L 54 112 Z"
                    fill="#b91c1c"
                    stroke="#fde68a"
                    strokeWidth="2"
                  />
                  {/* Gold Obi Belt */}
                  <rect
                    x="62"
                    y="82"
                    width="56"
                    height="11"
                    rx="3"
                    fill="#d4af37"
                    stroke="#78350f"
                    strokeWidth="1.2"
                  />
                  {/* Left Arm */}
                  <path
                    d={
                      anyCharacterJumping
                        ? 'M 64 66 L 36 42'
                        : 'M 64 66 L 44 82'
                    }
                    stroke="#fca5a5"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Right Arm holding Golden Sensu (Folding Fan) */}
                  <path
                    d={
                      anyCharacterJumping
                        ? 'M 116 66 L 144 38'
                        : 'M 116 66 L 136 78'
                    }
                    stroke="#fca5a5"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Golden Sensu Fan */}
                  <path
                    d={
                      anyCharacterJumping
                        ? 'M 144 38 L 130 16 A 22 22 0 0 1 164 24 Z'
                        : 'M 136 78 L 128 60 A 18 18 0 0 1 154 68 Z'
                    }
                    fill="#f59e0b"
                    stroke="#fef08a"
                    strokeWidth="1.5"
                  />
                  {/* Puppet Head */}
                  <circle
                    cx="90"
                    cy="40"
                    r="21"
                    fill="#fef3c7"
                    stroke="#78350f"
                    strokeWidth="2"
                  />
                  {/* Traditional Eboshi Hat */}
                  <path
                    d="M 74 24 L 90 4 L 106 24 Z"
                    fill="#1e1b4b"
                    stroke="#d4af37"
                    strokeWidth="1.8"
                  />
                  {/* Eyes & Expression */}
                  {lastActionStatus === 'disconnected' ? (
                    <>
                      <line x1="79" y1="38" x2="85" y2="38" stroke="#451a03" strokeWidth="2.2" />
                      <line x1="95" y1="38" x2="101" y2="38" stroke="#451a03" strokeWidth="2.2" />
                      <circle cx="90" cy="48" r="3" fill="#78350f" />
                    </>
                  ) : anyCharacterJumping ? (
                    <>
                      {/* Happy arc eyes ^ ^ */}
                      <path d="M 78 39 Q 82 33 86 39" fill="none" stroke="#78350f" strokeWidth="2.4" />
                      <path d="M 94 39 Q 98 33 102 39" fill="none" stroke="#78350f" strokeWidth="2.4" />
                      {/* Big joyful smile */}
                      <path d="M 83 46 Q 90 54 97 46" fill="#dc2626" />
                    </>
                  ) : (
                    <>
                      <circle cx="82" cy="38" r="2.6" fill="#1c120c" />
                      <circle cx="98" cy="38" r="2.6" fill="#1c120c" />
                      <path d="M 84 47 Q 90 51 96 47" fill="none" stroke="#991b1b" strokeWidth="2" />
                    </>
                  )}
                  {/* Rosy Cheeks */}
                  <circle cx="75" cy="44" r="3.5" fill="#f87171" opacity="0.65" />
                  <circle cx="105" cy="44" r="3.5" fill="#f87171" opacity="0.65" />
                </g>
              </svg>
            </div>

            <div className="puppet-stage-footer">
              <span className="puppet-jump-badge">
                🎎{' '}
                {locale === 'ja'
                  ? `総ジャンプ回数: ${totalJumpCount} 回`
                  : `Total Jumps: ${totalJumpCount}`}
              </span>
              <span className="puppet-state-pill">
                {anyCharacterJumping
                  ? locale === 'ja'
                    ? '🌟 跳躍演舞中！'
                    : '🌟 Jumping!'
                  : lastActionStatus === 'disconnected'
                    ? locale === 'ja'
                      ? '💤 信号待ち (未接続)'
                      : '💤 Disconnected'
                    : locale === 'ja'
                      ? '🟢 待機中'
                      : '🟢 Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 3: Hourglass Countdown & Fireworks Finale Stage */}
        <div
          className={`stage-zone stage-zone-finale ${
            anyStagePlaying ? 'finale-active' : ''
          }`}
        >
          <div className="stage-zone-label">
            🎆{' '}
            {locale === 'ja'
              ? '参ノ段：砂時計 ＆ 千本桜・花火フィナーレ'
              : 'Act III: Hourglass & Fireworks Finale'}
          </div>

          <div className="finale-stage-viewport">
            {/* Hourglass status */}
            <div
              className={`stage-hourglass-pill ${
                isTimerCounting ? 'hourglass-counting' : ''
              }`}
            >
              <span className="hourglass-icon">
                {isTimerCounting ? '⏳' : '🕰️'}
              </span>
              <span>
                {isTimerCounting
                  ? locale === 'ja'
                    ? '砂時計カウントダウン中…（満了で花火が開演します！）'
                    : 'Hourglass counting down... Fireworks will launch!'
                  : locale === 'ja'
                    ? '砂時計タイマー：待機中'
                    : 'Hourglass Timer: Idle'}
              </span>
            </div>

            {/* Fireworks & Cherry Blossom SVG Canvas */}
            <div className="fireworks-sky-box">
              {anyStagePlaying ? (
                <>
                  <svg viewBox="0 0 220 110" className="fireworks-svg">
                    {/* Firework Burst 1 (Gold/Vermilion) */}
                    <g className="fw-burst fw-burst-1" transform="translate(55, 42)">
                      <circle r="4" fill="#fef08a" />
                      <circle r="22" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 6" />
                      <circle r="34" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="2 8" />
                    </g>
                    {/* Firework Burst 2 (Sakura Pink/Cyan) */}
                    <g className="fw-burst fw-burst-2" transform="translate(155, 36)">
                      <circle r="4" fill="#fbcfe8" />
                      <circle r="20" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 5" />
                      <circle r="32" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 7" />
                    </g>
                    {/* Firework Burst 3 (Center Grand Gold) */}
                    <g className="fw-burst fw-burst-3" transform="translate(108, 56)">
                      <circle r="5" fill="#ffffff" />
                      <circle r="26" fill="none" stroke="#fde047" strokeWidth="2.5" strokeDasharray="4 6" />
                    </g>
                  </svg>
                  <div className="finale-banner-overlay">
                    <strong>
                      🎆{' '}
                      {locale === 'ja'
                        ? `大舞台・開演中！！ (${activeMediaCount}座)`
                        : `FESTIVAL STAGE LIVE! (${activeMediaCount})`}
                    </strong>
                    <span>
                      🌸 {locale === 'ja' ? 'ヒュー…ドォーン！雅楽と花火の舞' : 'Fireworks & Gagaku Finale!'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="finale-idle-placeholder">
                  <span className="idle-lantern-icon">🏮</span>
                  <p>
                    {locale === 'ja'
                      ? 'Timer や 太鼓・人形から「絵巻・舞台 (play)」へ水引が繋がると、ここに打ち上げ花火と桜吹雪が上がります！'
                      : 'When an event reaches a Media Stage (play), fireworks & cherry blossoms erupt here!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
