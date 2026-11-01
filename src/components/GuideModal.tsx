import React, { useState } from 'react';
import { Locale } from '../domain/i18n';

interface GuideModalProps {
  isOpen: boolean;
  locale: Locale;
  initialTab?: 'slides' | 'manual' | 'architecture';
  onClose: () => void;
  onStartOpeningAct: () => void;
  onLoadPresetAndClose: (presetId: string) => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  locale,
  initialTab = 'slides',
  onClose,
  onStartOpeningAct,
  onLoadPresetAndClose,
}) => {
  const [activeTab, setActiveTab] = useState<'slides' | 'manual' | 'architecture'>(
    initialTab
  );
  const [slideIndex, setSlideIndex] = useState(0);

  if (!isOpen) {
    return null;
  }

  const isJa = locale === 'ja';

  const slides = isJa
    ? [
        {
          badge: 'Slide 1 / 4 — コンセプト (Concept)',
          title: '「アプリを作る」前に、からくりブロックを繋いで遊ぼう',
          lead:
            'App LEGO からくり絵巻は、小さな機能ブロック（文・言霊・人形・砂時計・太鼓・舞台）を和紙の上に並べ、水引（みずひき）で結んで連鎖を楽しむ「体験型ソフトウェア玩具」です。',
          points: [
            '✨ プログラミング知識は一切不要。ボタン1つ、線1本からすぐ動く！',
            '🎎 江戸の「からくり人形」と現代の「ピタゴラスイッチ」を融合した和モダン体験',
            '🛡️ 完全ローカル動作・外部AI通信ゼロだから、壊れる心配なく何度でも実験できる',
          ],
          presetId: 'karakuri-chain',
          presetBtn: '🎎 弐ノ巻（五段連鎖）をキャンバスで試す',
        },
        {
          badge: 'Slide 2 / 4 — 基本操作 (3-Step Flow)',
          title: 'たった3つの動作：「鳴らす」「結ぶ・切る」「巻き戻す」',
          lead:
            'ブロックの右側にある【出力ポート ●】から、別のブロックの左側にある【入力ポート ●】へ水引を結ぶだけで、イベント（金色の言霊玉）が流れます。',
          points: [
            '1️⃣ 鳴らす：【📨 Send】や【▶️ Start Timer】を押すと出力ポートから言霊玉が発射！',
            '2️⃣ 結ぶ・切る：右ポート [●] → 左ポート [●] の順でクリックして接続。【✂️ 切断】でいつでも解除',
            '3️⃣ 巻き戻す：【↩️ Undo (戻す)】を押せば、直前の状態に何度でもタイムスリップ',
          ],
          presetId: 'poc0-basic',
          presetBtn: '📜 壱ノ巻（基本の二対）で試す',
        },
        {
          badge: 'Slide 3 / 4 — 多段連鎖と必殺奥義 (Rube Goldberg & Combo)',
          title: 'ピタゴラ五段連鎖 ＆ 三連太鼓の同時演舞',
          lead:
            '中間に「言霊フィルター」や「太鼓カウンター」を挟んだり、人形の「着地（landed）」から砂時計の「開始（start）」へ繋ぐことで、驚くような連鎖が生まれます。',
          points: [
            '⛩️ 言霊フィルター：普通の言葉を「🌸雅（和歌調）」「⚔️武士」「🎉祭（関西ノリ）」に変換！',
            '🥁 太鼓カウンター：3回叩いたときだけ満願成就となり、複数の舞台を一斉に開演！',
            '🌸 千本桜（1対多配線）：1つの出力ポートから複数のブロックへ同時に水引を分岐可能',
          ],
          presetId: 'taiko-combo',
          presetBtn: '🥁 参ノ巻（三連太鼓の奥義）で試す',
        },
        {
          badge: 'Slide 4 / 4 — 自働化（JIDOKA）とポカヨケ (Safety by Design)',
          title: '間違った結線は「入れる前に防ぐ」トヨタ式 JIDOKA 設計',
          lead:
            '出力同士を繋ごうとしたり、無限ループ（閉路）を作ろうとすると、絵巻が壊れる前に優しい警告バナーで防ぎます（ポカヨケ）。',
          points: [
            '🛑 事前型検査：互換性のないポート・自己ループ・循環ループは挿入前に安全にブロック',
            '🧪 からくり工房：好みのセリフや秒数のカスタムブロックを JIDOKA 安全証跡付きで召喚',
            '🔗 絵巻URL共有：作ったからくりを #emaki=... のURLハッシュにしてワンクリック共有',
          ],
          presetId: 'senbonzakura',
          presetBtn: '🌸 肆ノ巻（千本桜・一斉演舞）で試す',
        },
      ]
    : [
        {
          badge: 'Slide 1 / 4 — Concept Vision',
          title: 'Before Building Serious Apps, Play by Connecting Karakuri Blocks!',
          lead:
            'App LEGO Karakuri Emaki is a tactile software toy where you arrange small functional blocks on an Echizen Washi scroll and tie them together with Mizuhiki cords to spark chain reactions.',
          points: [
            '✨ Zero coding required — press a button or tie a cord to see instant reactions',
            '🎎 Inspired by Edo-period Karakuri mechanical puppets & Rube Goldberg machines',
            '🛡️ 100% local & deterministic (zero external AI/API calls) so you can experiment freely',
          ],
          presetId: 'karakuri-chain',
          presetBtn: '🎎 Try Scroll II (5-Stage Chain) on Canvas',
        },
        {
          badge: 'Slide 2 / 4 — Core Mechanics',
          title: 'Just 3 Actions: Fire, Connect/Cut, and Undo',
          lead:
            'Connect an [Output Port ●] on the right side of a block to an [Input Port ●] on the left side of another block. Golden Kotodama orbs travel along the cord!',
          points: [
            '1️⃣ Fire: Press [📨 Send] or [▶️ Start Timer] to emit a trigger event',
            '2️⃣ Connect / Cut: Click right port [●] → left port [●] to tie; click [✂️ Cut] anytime',
            '3️⃣ Undo: Press [↩️ Undo] to restore previous graph snapshots up to 30 steps',
          ],
          presetId: 'poc0-basic',
          presetBtn: '📜 Try Scroll I (Basic Pairs)',
        },
        {
          badge: 'Slide 3 / 4 — Multi-Stage Chains & Combos',
          title: '5-Stage Rube Goldberg Chains & 3-Hit Taiko Combos',
          lead:
            'Insert a Kotodama Filter or Taiko Counter in the middle, or chain Puppet [landed] into Hourglass [start] to orchestrate multi-stage performances.',
          points: [
            '⛩️ Kotodama Filter: Transforms messages into Miyabi (Poetic), Bushido (Samurai), or Festival style!',
            '🥁 Taiko Counter: Counts hits and fires a [combo] burst on the 3rd strike!',
            '🌸 Fan-Out Wiring: Branch one Output port to multiple Input ports simultaneously',
          ],
          presetId: 'taiko-combo',
          presetBtn: '🥁 Try Scroll III (3-Hit Taiko Combo)',
        },
        {
          badge: 'Slide 4 / 4 — JIDOKA Safety & Poka-Yoke',
          title: 'Mistake-Proofing (Poka-Yoke): Reject Invalid Wires Before Insertion',
          lead:
            'If you try to wire Output-to-Output, self-loops, or circular loops, the graph engine safely rejects the wire with a friendly banner and leaves your scroll intact.',
          points: [
            '🛑 Pure Type & Cycle Validation + Bounded Runtime (maxHops=8, maxDeliveries=32)',
            '🧪 Craft Studio: Summon custom blocks with an instant JIDOKA PASS safety receipt',
            '🔗 Serverless URL Sharing: Share your scroll via #emaki=... Base64URL hashes',
          ],
          presetId: 'senbonzakura',
          presetBtn: '🌸 Try Scroll IV (Senbonzakura Fan-Out)',
        },
      ];

  const currentSlide = slides[slideIndex];

  return (
    <div
      className="guide-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={isJa ? '絵巻指南書・紹介スライド' : 'Guide & Concept Slides'}
      data-testid="guide-modal"
    >
      <div className="guide-modal-card">
        <header className="guide-modal-header">
          <div className="guide-modal-title-row">
            <span className="hanko-seal-sm" aria-hidden="true">
              伝
            </span>
            <div>
              <h2>
                {isJa
                  ? 'App LEGO からくり絵巻 — 秘伝指南書 ＆ 紹介スライド'
                  : 'App LEGO Karakuri Emaki — Visual Guide & Concept Slides'}
              </h2>
              <p>
                {isJa
                  ? '初めての方でも1分で遊び方と仕組みがわかる図解ガイド'
                  : 'Visual concept slides, step-by-step wiring manual, and architecture diagrams'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="guide-close-btn"
            data-testid="close-guide-modal-btn"
            onClick={onClose}
            aria-label={isJa ? '閉じる' : 'Close'}
          >
            ✕ {isJa ? '閉じる' : 'Close'}
          </button>
        </header>

        <nav className="guide-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'slides'}
            className={`guide-tab-btn ${activeTab === 'slides' ? 'active' : ''}`}
            data-testid="guide-tab-slides"
            onClick={() => setActiveTab('slides')}
          >
            🎞️ {isJa ? '紹介スライド (全4枚)' : 'Concept Slides (4)'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            className={`guide-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            data-testid="guide-tab-manual"
            onClick={() => setActiveTab('manual')}
          >
            🧭 {isJa ? '図解・操作マニュアル' : 'Visual Operation Manual'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'architecture'}
            className={`guide-tab-btn ${
              activeTab === 'architecture' ? 'active' : ''
            }`}
            data-testid="guide-tab-architecture"
            onClick={() => setActiveTab('architecture')}
          >
            🛡️ {isJa ? 'からくり図解・安全設計' : 'Architecture & Safety Diagram'}
          </button>
        </nav>

        <div className="guide-modal-body">
          {activeTab === 'slides' && (
            <div className="slide-deck-container" data-testid="slide-deck-view">
              <div className="slide-hero-visual">
                <img
                  src="/karakuri-concept-hero.jpg"
                  alt={
                    isJa
                      ? '和モダン・からくり絵巻のコンセプトイラスト（獅子舞からくり人形・文箱・砂時計・太鼓・鳥居フィルター・提灯舞台が水引と金色の言霊玉で結ばれている絵巻）'
                      : 'Wa-Modern Karakuri Emaki concept illustration showing wooden Karakuri puppets connected by Mizuhiki cords'
                  }
                  className="concept-hero-img"
                />
                <div className="slide-overlay-badge">{currentSlide.badge}</div>
              </div>

              <div className="slide-content-box">
                <h3>{currentSlide.title}</h3>
                <p className="slide-lead">{currentSlide.lead}</p>
                <ul className="slide-points">
                  {currentSlide.points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>

                <div className="slide-cta-row">
                  <button
                    type="button"
                    className="slide-action-primary"
                    data-testid="slide-start-tour-btn"
                    onClick={() => {
                      onClose();
                      onStartOpeningAct();
                    }}
                  >
                    🎭{' '}
                    {isJa
                      ? '3ステップ体験ツアー（序幕）を始める'
                      : 'Start 3-Step Hands-On Tour'}
                  </button>
                  <button
                    type="button"
                    className="slide-action-secondary"
                    onClick={() => onLoadPresetAndClose(currentSlide.presetId)}
                  >
                    {currentSlide.presetBtn}
                  </button>
                </div>
              </div>

              <footer className="slide-Controls-bar">
                <button
                  type="button"
                  className="slide-nav-btn"
                  data-testid="slide-prev-btn"
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                >
                  ◀ {isJa ? '前のスライド' : 'Prev Slide'}
                </button>
                <div className="slide-dots">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`slide-dot ${idx === slideIndex ? 'active' : ''}`}
                      onClick={() => setSlideIndex(idx)}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="slide-nav-btn"
                  data-testid="slide-next-btn"
                  disabled={slideIndex === slides.length - 1}
                  onClick={() =>
                    setSlideIndex((i) => Math.min(slides.length - 1, i + 1))
                  }
                >
                  {isJa ? '次のスライド' : 'Next Slide'} ▶
                </button>
              </footer>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="manual-view" data-testid="manual-view">
              <div className="manual-diagram-box">
                <h3>
                  {isJa
                    ? '📐 1目でわかる！水引の結び方とイベントの流れ'
                    : '📐 How to Wire Blocks & Trigger Events'}
                </h3>
                {/* Crisp inline SVG visual diagram */}
                <svg
                  viewBox="0 0 760 155"
                  className="concept-svg-diagram"
                  role="img"
                  aria-label={
                    isJa
                      ? 'ブロックの右側の出力ポートから別ブロックの左側の入力ポートへ水引を結ぶ図解'
                      : 'Diagram showing Output port on the right connecting to Input port on the left'
                  }
                >
                  <defs>
                    <linearGradient id="guideCordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="50%" stopColor="#c89d3c" />
                      <stop offset="100%" stopColor="#6b21a8" />
                    </linearGradient>
                  </defs>
                  {/* Left Block: Message */}
                  <rect
                    x="20"
                    y="20"
                    width="210"
                    height="115"
                    rx="10"
                    fill="#fffdf8"
                    stroke="#1e3a8a"
                    strokeWidth="2.5"
                  />
                  <text x="36" y="48" fill="#1e3a8a" fontSize="14" fontWeight="bold">
                    {isJa ? '① 文 (Message)' : '① Message Block'}
                  </text>
                  <rect
                    x="36"
                    y="62"
                    width="120"
                    height="28"
                    rx="6"
                    fill="#1e3a8a"
                  />
                  <text x="52" y="80" fill="#ffffff" fontSize="12" fontWeight="bold">
                    {isJa ? '📨 Send を押す' : '📨 Press Send'}
                  </text>
                  {/* Output Port Pill */}
                  <rect
                    x="148"
                    y="96"
                    width="74"
                    height="24"
                    rx="12"
                    fill="#fef3c7"
                    stroke="#b45309"
                    strokeWidth="2"
                  />
                  <text x="158" y="112" fill="#78350f" fontSize="11" fontWeight="bold">
                    sent ●
                  </text>

                  {/* Mizuhiki Bezier Cord */}
                  <path
                    d="M 222 108 C 310 108, 340 65, 430 65"
                    fill="none"
                    stroke="url(#guideCordGrad)"
                    strokeWidth="5"
                  />
                  <circle cx="326" cy="86" r="9" fill="#fbbf24" stroke="#b91c1c" strokeWidth="2" />
                  <text x="234" y="32" fill="#991b1b" fontSize="11.5" fontWeight="bold">
                    {isJa
                      ? '② 水引を通って金色の言霊玉が走る！'
                      : '② Golden orb travels along Mizuhiki cord!'}
                  </text>
                  <text x="234" y="136" fill="#5c4938" fontSize="10.5">
                    {isJa
                      ? '（✂️ 切断で解除 / ↩️ Undoで復元）'
                      : '(Click ✂️ Cut / ↩️ Undo to restore)'}
                  </text>

                  {/* Right Block: Character */}
                  <rect
                    x="435"
                    y="20"
                    width="295"
                    height="115"
                    rx="10"
                    fill="#fffdf8"
                    stroke="#6b21a8"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="443"
                    y="53"
                    width="76"
                    height="24"
                    rx="12"
                    fill="#f3e8ff"
                    stroke="#6b21a8"
                    strokeWidth="2"
                  />
                  <text x="453" y="69" fill="#581c87" fontSize="11" fontWeight="bold">
                    ● jump
                  </text>
                  <text x="530" y="48" fill="#581c87" fontSize="14" fontWeight="bold">
                    {isJa ? '③ からくり人形 (Character)' : '③ Karakuri Puppet'}
                  </text>
                  <text x="530" y="76" fill="#231915" fontSize="12">
                    {isJa
                      ? '🎉 吹き出しを出してジャンプ！'
                      : '🎉 Jumps with speech bubble!'}
                  </text>
                  <rect
                    x="625"
                    y="94"
                    width="94"
                    height="24"
                    rx="12"
                    fill="#fef3c7"
                    stroke="#b45309"
                    strokeWidth="1.5"
                  />
                  <text x="635" y="110" fill="#78350f" fontSize="11" fontWeight="bold">
                    landed ● →
                  </text>
                </svg>
              </div>

              <div className="manual-steps-grid">
                <div className="manual-step-card">
                  <span className="step-num">STEP 1</span>
                  <h4>{isJa ? '📜 絵巻プリセットを選ぶ' : '📜 Pick a Story Scroll'}</h4>
                  <p>
                    {isJa
                      ? 'まずは画面上部の「壱ノ巻〜肆ノ巻」をクリックして、完成済みのからくり絵巻を動かしてみましょう。'
                      : 'Click Scroll I–IV in the top bar to load ready-made Karakuri contraptions.'}
                  </p>
                </div>
                <div className="manual-step-card">
                  <span className="step-num">STEP 2</span>
                  <h4>{isJa ? '🧵 水引を結ぶ・組み替える' : '🧵 Connect & Rewire Ports'}</h4>
                  <p>
                    {isJa
                      ? 'ブロック右側の【出力ポート ●】をクリックし、別ブロック左側の【入力ポート ●】をクリックすると新しい水引が結ばれます。'
                      : 'Click an Output port [●] on the right of a block, then click an Input port [●] on the left of another block.'}
                  </p>
                </div>
                <div className="manual-step-card">
                  <span className="step-num">STEP 3</span>
                  <h4>{isJa ? '🧰 道具箱や工房から追加' : '🧰 Add from Toybox or Studio'}</h4>
                  <p>
                    {isJa
                      ? '左側の「からくり道具箱」や上部の「🧪 からくり工房」から新しいブロックを追加し、ドラッグで自由に配置できます。'
                      : 'Click any block in the left Toybox or summon a customized block from the Craft Studio, then drag to position.'}
                  </p>
                </div>
              </div>

              <h3 className="catalog-heading">
                {isJa
                  ? '🎎 全6種・からくりブロック図鑑'
                  : '🎎 Complete Catalog of the 6 Karakuri Blocks'}
              </h3>
              <div className="block-catalog-grid">
                <div className="catalog-item">
                  <strong>📜 Message（文・メッセージ）</strong>
                  <span>
                    {isJa
                      ? '出力: sent | ボタンを押すと言霊（テキスト）を発射します。'
                      : 'Out: sent | Emits a trigger event with text when Send is clicked.'}
                  </span>
                </div>
                <div className="catalog-item">
                  <strong>⛩️ Filter（言霊フィルター）</strong>
                  <span>
                    {isJa
                      ? '入力: in / 出力: out | 言葉を「🌸雅・⚔️武士・🎉祭」に変換して次へ繋ぎます。'
                      : 'In: in / Out: out | Transforms text into Miyabi, Bushido, or Festival style.'}
                  </span>
                </div>
                <div className="catalog-item">
                  <strong>🥁 Counter（太鼓カウンター）</strong>
                  <span>
                    {isJa
                      ? '入力: hit / 出力: combo | 3回叩かれると満願成就となり奥義を発火します。'
                      : 'In: hit / Out: combo | Fires combo output every Nth (3rd) hit.'}
                  </span>
                </div>
                <div className="catalog-item">
                  <strong>🎎 Character（からくり人形）</strong>
                  <span>
                    {isJa
                      ? '入力: jump / 出力: landed | 吹き出しを出して跳ね、着地時に次を起動します。'
                      : 'In: jump / Out: landed | Jumps with a speech bubble and chains via landed.'}
                  </span>
                </div>
                <div className="catalog-item">
                  <strong>🕰️ Timer（刻・砂時計）</strong>
                  <span>
                    {isJa
                      ? '入力: start / 出力: elapsed | カウントダウン後に次のブロックを起動します。'
                      : 'In: start / Out: elapsed | Counts down (1–5s) and fires elapsed once.'}
                  </span>
                </div>
                <div className="catalog-item">
                  <strong>🏮 Media Card（絵巻・舞台）</strong>
                  <span>
                    {isJa
                      ? '入力: play | 雅楽・千両花火のモック演舞ステージをトグルします。'
                      : 'In: play | Toggles the festive lantern & fireworks stage animation.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="architecture-view" data-testid="architecture-view">
              <h3>
                {isJa
                  ? '🛡️ 五段ピタゴラ連鎖 ＆ JIDOKA 安全アーキテクチャ図解'
                  : '🛡️ 5-Stage Chain & JIDOKA Safety Architecture Diagram'}
              </h3>
              <svg
                viewBox="0 0 760 210"
                className="concept-svg-diagram"
                role="img"
                aria-label="5-stage chain and JIDOKA validation architecture diagram"
              >
                {/* 5-Stage Chain Row */}
                <rect x="15" y="18" width="125" height="68" rx="8" fill="#eff6ff" stroke="#1e3a8a" strokeWidth="2" />
                <text x="26" y="44" fill="#1e3a8a" fontSize="12" fontWeight="bold">1. 📜 Message</text>
                <text x="26" y="66" fill="#334155" fontSize="11">sent (trigger)</text>

                <text x="146" y="56" fill="#b45309" fontSize="16" fontWeight="bold">➔</text>

                <rect x="166" y="18" width="125" height="68" rx="8" fill="#fdf2f8" stroke="#be185d" strokeWidth="2" />
                <text x="176" y="44" fill="#be185d" fontSize="12" fontWeight="bold">2. ⛩️ Filter</text>
                <text x="176" y="66" fill="#334155" fontSize="11">in ➔ 言霊変換 ➔ out</text>

                <text x="297" y="56" fill="#b45309" fontSize="16" fontWeight="bold">➔</text>

                <rect x="317" y="18" width="130" height="68" rx="8" fill="#faf5ff" stroke="#6b21a8" strokeWidth="2" />
                <text x="327" y="44" fill="#6b21a8" fontSize="12" fontWeight="bold">3. 🎎 Character</text>
                <text x="327" y="66" fill="#334155" fontSize="11">jump ➔ 舞 ➔ landed</text>

                <text x="453" y="56" fill="#b45309" fontSize="16" fontWeight="bold">➔</text>

                <rect x="473" y="18" width="125" height="68" rx="8" fill="#fffbeb" stroke="#b45309" strokeWidth="2" />
                <text x="483" y="44" fill="#b45309" fontSize="12" fontWeight="bold">4. 🕰️ Timer</text>
                <text x="483" y="66" fill="#334155" fontSize="11">start ➔ 2s ➔ elapsed</text>

                <text x="604" y="56" fill="#b45309" fontSize="16" fontWeight="bold">➔</text>

                <rect x="624" y="18" width="120" height="68" rx="8" fill="#ecfdf5" stroke="#15803d" strokeWidth="2" />
                <text x="634" y="44" fill="#15803d" fontSize="12" fontWeight="bold">5. 🏮 Media</text>
                <text x="634" y="66" fill="#334155" fontSize="11">play (舞台開演!)</text>

                {/* JIDOKA Safety Layer Box */}
                <rect x="15" y="110" width="730" height="84" rx="10" fill="#181311" stroke="#c89d3c" strokeWidth="2" />
                <text x="32" y="138" fill="#fde68a" fontSize="13" fontWeight="bold">
                  {isJa
                    ? '🛡️ JIDOKA（自働化）安全エンジン — 純粋関数による3重防護壁'
                    : '🛡️ JIDOKA Safety Engine — 3 Layers of Pure Deterministic Protection'}
                </text>
                <text x="32" y="162" fill="#f5efe6" fontSize="11.5">
                  {isJa
                    ? '① validateConnection: 自己ループ・重複・閉路（Cycle）・未対応ポート（jumped: notification）を接続前に拒否'
                    : '① validateConnection: Blocks self-loops, duplicates, cycles & unsupported ports before insertion'}
                </text>
                <text x="32" y="181" fill="#f5efe6" fontSize="11.5">
                  {isJa
                    ? '② dispatchEvent & sanitizeGraph: maxHops=8 / maxDeliveries=32 上限 ＋ URL共有やカスタム召喚も完全無害化（eval・外部通信ゼロ）'
                    : '② dispatchEvent & sanitizeGraph: Bounded hops (maxHops=8, maxDeliveries=32) + strict whitelist sanitization (Zero eval / Zero API)'}
                </text>
              </svg>

              <div className="architecture-notes">
                <p>
                  {isJa
                    ? '💡 ヒント：からくり人形の「jumped（notification・予約）」ポートへ水引を結ぼうとすると、G02ポカヨケ検査が働いて警告バナーが表示される様子も実際に体験できます。'
                    : '💡 Tip: Try wiring the dashed "jumped (notification)" port on the Puppet block to see the JIDOKA G02 Poka-Yoke warning banner in action!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
