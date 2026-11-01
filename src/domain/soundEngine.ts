import { FilterStyle } from './types';

export type SoundEffectKind =
  | 'koto_send'
  | 'suzu_wire'
  | 'kagura_filter'
  | 'tsuzumi_jump'
  | 'taiko_hit'
  | 'odaiko_combo'
  | 'hyoshigi_tick'
  | 'hansho_elapsed'
  | 'hanabi_finale'
  | 'shamisen_error'
  | 'cut_cord'
  | 'undo_restore';

class KarakuriSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) {
      return null;
    }
    if (typeof window === 'undefined') {
      return null;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }
    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * 📨 文（メッセージ）送信音：琴の爪弾き (Koto pentatonic arpeggio)
   */
  public playMessageSend(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Japanese Hirajoshi / Miyako-bushi pentatonic notes: D5,Eb5,G5,A5
    const notes = [587.33, 659.25, 880.0];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.996, startTime + 0.35);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /**
   * 〰️ 水引を言霊玉が走る音：鈴・風鈴のきらめき (Suzu shimmer)
   */
  public playWireTravel(stepIndex: number = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = 1320 + (stepIndex % 5) * 180;

    [baseFreq, baseFreq * 1.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + i * 0.03;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t0 + 0.18);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.09, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    });
  }

  /**
   * ⛩️ 言霊フィルター変身音：神楽鈴・三味線・祭笛 (Filter transformation)
   */
  public playFilterTransform(style: FilterStyle = 'miyabi'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord =
      style === 'miyabi'
        ? [523.25, 659.25, 783.99, 1046.5] // Ethereal Gagaku / Koto shimmer
        : style === 'bushido'
          ? [220.0, 329.63, 440.0] // Bold Samurai Shamisen power strike
          : [587.33, 783.99, 987.77, 1174.66]; // Festive Kansai Matsuri whistle

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = style === 'bushido' ? 'sawtooth' : 'triangle';
      const t0 = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, t0);
      if (style === 'kansai') {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t0 + 0.18);
      }

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(
        style === 'bushido' ? 0.12 : 0.14,
        t0 + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.36);
    });
  }

  /**
   * 🎎 からくり人形ジャンプ音：小鼓「ポンッ！」＋跳躍音 (Kotsuzumi drum & jump)
   */
  public playCharacterJump(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Kotsuzumi "Pon!" (characteristic upward pitch bend on skin membrane)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.26);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // 2. Crisp wooden fan/karakuri clack on landing
    const clack = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clack.type = 'triangle';
    const landTime = now + 0.18;
    clack.frequency.setValueAtTime(880, landTime);
    clack.frequency.exponentialRampToValueAtTime(520, landTime + 0.08);

    clackGain.gain.setValueAtTime(0.001, landTime);
    clackGain.gain.linearRampToValueAtTime(0.14, landTime + 0.008);
    clackGain.gain.exponentialRampToValueAtTime(0.001, landTime + 0.09);

    clack.connect(clackGain);
    clackGain.connect(ctx.destination);
    clack.start(landTime);
    clack.stop(landTime + 0.1);
  }

  /**
   * 🥁 和太鼓ヒット音：「ドン！」＆ 満願成就時は「カッ！ドドーン！！」
   */
  public playTaikoHit(isComboComplete: boolean = false): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Deep Wadaiko body thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isComboComplete ? 145 : 120, now);
    sub.frequency.exponentialRampToValueAtTime(
      isComboComplete ? 42 : 52,
      now + (isComboComplete ? 0.45 : 0.26)
    );

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(isComboComplete ? 0.38 : 0.3, now + 0.012);
    subGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isComboComplete ? 0.5 : 0.28)
    );

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + (isComboComplete ? 0.52 : 0.3));

    // Rim shot "Ka!"
    const rim = ctx.createOscillator();
    const rimGain = ctx.createGain();
    rim.type = 'square';
    rim.frequency.setValueAtTime(680, now);
    rim.frequency.exponentialRampToValueAtTime(240, now + 0.045);

    rimGain.gain.setValueAtTime(0.001, now);
    rimGain.gain.linearRampToValueAtTime(0.12, now + 0.004);
    rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    rim.connect(rimGain);
    rimGain.connect(ctx.destination);
    rim.start(now);
    rim.stop(now + 0.06);

    if (isComboComplete) {
      // Second mighty "DO-DOON!" + Golden gong
      const t2 = now + 0.14;
      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(160, t2);
      boom.frequency.exponentialRampToValueAtTime(38, t2 + 0.65);

      boomGain.gain.setValueAtTime(0.001, t2);
      boomGain.gain.linearRampToValueAtTime(0.4, t2 + 0.015);
      boomGain.gain.exponentialRampToValueAtTime(0.0008, t2 + 0.68);

      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start(t2);
      boom.stop(t2 + 0.7);
    }
  }

  /**
   * 🕰️ 砂時計カウント開始・刻み音：拍子木「カチッ」
   */
  public playTimerTick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.055);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 🔔 砂時計満了音：半鐘・銅鑼「ゴーン！」
   */
  public playTimerElapsed(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [523.25, 784.88, 1188.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.992, now + 0.65);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 / (i + 1), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.68);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    });
  }

  /**
   * 🎆 絵巻舞台（Media Card）開演ファンファーレ＆打ち上げ花火音
   */
  public playStageFinale(isOpening: boolean = true): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (!isOpening) {
      // Gentle curtain close chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    // 1. Rising firework whistle ("Hyuuuuu...")
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(440, now);
    whistle.frequency.exponentialRampToValueAtTime(1480, now + 0.24);

    whistleGain.gain.setValueAtTime(0.001, now);
    whistleGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    whistle.connect(whistleGain);
    whistleGain.connect(ctx.destination);
    whistle.start(now);
    whistle.stop(now + 0.26);

    // 2. Firework burst + Festive Yo-scale Fanfare chord ("DOOON! ✨")
    const burstTime = now + 0.22;
    const fanfareNotes = [261.63, 523.25, 587.33, 783.99, 1046.5];
    fanfareNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      const t0 = burstTime + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t0);
      if (idx === 0) {
        osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.45);
      }

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.32 : 0.15, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.68);
    });
  }

  /**
   * ✂️ 水引切断音 / ↩️ Undo復元音 / ⚠️ 不正接続エラー音
   */
  public playFeedback(kind: 'cut' | 'undo' | 'error'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (kind === 'error') {
      // Shamisen dissonant buzz ("Ben...")
      [155.56, 164.81].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 0.92, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } else if (kind === 'cut') {
      // Snip sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Undo restore upward chime
      [523.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t0 = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.14, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.22);
      });
    }
  }
}

export const soundEngine = new KarakuriSoundEngine();
