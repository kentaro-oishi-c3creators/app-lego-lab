import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

describe('App LEGO UI Integration — Gates G04 & G05 + PoC 1 All-in-One', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.setItem('app_lego_guide_seen_v1', 'true');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Scenario 1–4 (G04): Message->Character jumps on Send, stops when disconnected, and resumes after Undo', () => {
    render(<App />);

    // 1. Fresh launch: sample graph has msg-1, char-1, timer-1, media-1
    const charBody = screen.getByTestId('character-body-char-1');
    expect(charBody.getAttribute('data-jump-count')).toBe('0');

    // 2. Send while connected -> Character jumps once
    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(charBody.getAttribute('data-jump-count')).toBe('1');
    expect(charBody.getAttribute('data-jumping')).toBe('true');

    // Advance 650ms -> jumping transient state resets, jumpCount remains 1
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(charBody.getAttribute('data-jumping')).toBe('false');
    expect(charBody.getAttribute('data-jump-count')).toBe('1');

    // 3. Remove edge-1 -> Send does NOT increment jumpCount
    fireEvent.click(screen.getByTestId('chip-disconnect-edge-1'));
    expect(screen.queryByTestId('edge-chip-edge-1')).toBeNull();

    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(charBody.getAttribute('data-jump-count')).toBe('1');

    // 4. Undo disconnection -> edge-1 returns and Send triggers jump again
    fireEvent.click(screen.getByTestId('undo-btn'));
    expect(screen.getByTestId('edge-chip-edge-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(charBody.getAttribute('data-jump-count')).toBe('2');
  });

  it('Scenario 5 (G02/UI): Rejects self-loop, output->output, and unsupported notification port with warning banner and unchanged edges', () => {
    render(<App />);

    // Self-loop attempt: click msg-1.sent twice
    fireEvent.click(screen.getByTestId('port-msg-1-sent'));
    fireEvent.click(screen.getByTestId('port-msg-1-sent'));

    expect(screen.getByTestId('warning-banner').textContent).toContain('SELF_LOOP');
    expect(screen.getByTestId('edge-chip-edge-1')).toBeInTheDocument();
    expect(screen.getByTestId('edge-chip-edge-2')).toBeInTheDocument();

    // Unsupported notification port attempt: char-1.jumped -> media-1.play
    fireEvent.click(screen.getByTestId('port-char-1-jumped'));
    fireEvent.click(screen.getByTestId('port-media-1-play'));
    expect(screen.getByTestId('warning-banner').textContent).toContain(
      'UNSUPPORTED_PORT_TYPE'
    );
  });

  it('Scenario 6 (G05): Timer fires once after 3s countdown and cleans up when Timer block is deleted', () => {
    render(<App />);

    const mediaBody = screen.getByTestId('media-body-media-1');
    expect(mediaBody.getAttribute('data-playing')).toBe('false');
    expect(mediaBody.getAttribute('data-toggle-count')).toBe('0');

    // Start 3-second timer
    fireEvent.click(screen.getByTestId('start-timer-btn-timer-1'));
    expect(screen.getByTestId('timer-body-timer-1').getAttribute('data-running')).toBe(
      'true'
    );

    // Advance 3000ms -> fires once
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(mediaBody.getAttribute('data-playing')).toBe('true');
    expect(mediaBody.getAttribute('data-toggle-count')).toBe('1');

    // Advance more time -> does NOT fire again without starting
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mediaBody.getAttribute('data-toggle-count')).toBe('1');

    // Start timer again, then delete timer-1 before 3s elapses -> must cancel and NOT toggle media-1
    fireEvent.click(screen.getByTestId('start-timer-btn-timer-1'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByTestId('delete-node-timer-1'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mediaBody.getAttribute('data-toggle-count')).toBe('1');
  });

  it('Scenario 7: Empty Canvas and Reset Demo work deterministically', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('empty-canvas-btn'));
    expect(screen.getByTestId('no-active-edges')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-empty-hint')).toBeInTheDocument();

    // Add Message and Character on empty canvas and connect them
    fireEvent.click(screen.getByTestId('add-message-btn'));
    fireEvent.click(screen.getByTestId('add-character-btn'));
    fireEvent.click(screen.getByTestId('port-msg-2-sent'));
    fireEvent.click(screen.getByTestId('port-char-3-jump'));

    fireEvent.click(screen.getByTestId('send-btn-msg-2'));
    expect(
      screen.getByTestId('character-body-char-3').getAttribute('data-jump-count')
    ).toBe('1');

    // Reset Demo restores original sample graph
    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    expect(screen.getByTestId('block-node-msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('block-node-char-1')).toBeInTheDocument();
    expect(screen.getByTestId('edge-chip-edge-1')).toBeInTheDocument();
    expect(screen.getByTestId('edge-chip-edge-2')).toBeInTheDocument();
  });

  it('Regression (Poka-yoke): synchronous rapid multi-action clicks preserve state and unique log keys without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App />);

    act(() => {
      (screen.getByTestId('send-btn-msg-1') as HTMLButtonElement).click();
      (screen.getByTestId('chip-disconnect-edge-1') as HTMLButtonElement).click();
      (screen.getByTestId('send-btn-msg-1') as HTMLButtonElement).click();
      (screen.getByTestId('port-msg-1-sent') as HTMLButtonElement).click();
      (screen.getByTestId('port-msg-1-sent') as HTMLButtonElement).click();
    });

    expect(
      screen.getByTestId('character-body-char-1').getAttribute('data-jump-count')
    ).toBe('1');
    expect(screen.getByTestId('warning-banner').textContent).toContain('SELF_LOOP');
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('PoC 1 Karakuri 5-Stage Chain: Message -> Filter -> Character -> Timer -> MediaCard', () => {
    render(<App />);

    // Load Preset 2: 弐ノ巻：からくり五段連鎖
    fireEvent.click(screen.getByTestId('preset-btn-karakuri-chain'));

    const charBody = screen.getByTestId('character-body-char-1');
    const timerBody = screen.getByTestId('timer-body-timer-1');
    const mediaBody = screen.getByTestId('media-body-media-1');

    expect(charBody.getAttribute('data-jump-count')).toBe('0');
    expect(mediaBody.getAttribute('data-playing')).toBe('false');

    // Click Send on msg-1 -> Filter transforms text -> Character jumps with speech bubble -> Timer starts automatically!
    fireEvent.click(screen.getByTestId('send-btn-msg-1'));

    expect(charBody.getAttribute('data-jump-count')).toBe('1');
    expect(screen.getByTestId('character-speech-char-1').textContent).toContain(
      '花鳥風月'
    );
    expect(timerBody.getAttribute('data-running')).toBe('true');

    // Advance 2100ms for the 2-second hourglass timer -> MediaCard plays!
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(mediaBody.getAttribute('data-playing')).toBe('true');
    expect(mediaBody.getAttribute('data-toggle-count')).toBe('1');
  });

  it('PoC 1 Taiko 3-Hit Combo & Karakuri Studio Summon + URL Share', () => {
    render(<App />);

    // Load Preset 3: 参ノ巻：三連太鼓の奥義
    fireEvent.click(screen.getByTestId('preset-btn-taiko-combo'));

    const counterBody = screen.getByTestId('counter-body-counter-1');
    const charBody = screen.getByTestId('character-body-char-1');
    const mediaBody = screen.getByTestId('media-body-media-1');

    // Hit 1 & Hit 2: accumulates drum hits without firing combo yet
    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(counterBody.getAttribute('data-current-count')).toBe('1');
    expect(charBody.getAttribute('data-jump-count')).toBe('0');

    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(counterBody.getAttribute('data-current-count')).toBe('2');
    expect(charBody.getAttribute('data-jump-count')).toBe('0');

    // Hit 3: reaches targetCount=3 -> fires combo -> both Character and Media Card react!
    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(counterBody.getAttribute('data-combo-count')).toBe('1');
    expect(charBody.getAttribute('data-jump-count')).toBe('1');
    expect(mediaBody.getAttribute('data-playing')).toBe('true');

    // Open Karakuri Studio and summon a custom block with JIDOKA receipt
    fireEvent.click(screen.getByTestId('toggle-studio-btn'));
    expect(screen.getByTestId('karakuri-studio-drawer')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('craft-summon-btn'));
    expect(screen.getByTestId('craft-receipt').textContent).toContain(
      'JIDOKA 検査 PASS'
    );

    // Click Share URL button -> generates #emaki=... hash and toast
    fireEvent.click(screen.getByTestId('share-url-btn'));
    expect(screen.getByTestId('share-toast-banner').textContent).toContain('#emaki=');
  });

  it('UX Upgrade: First-visit auto-opens Guide Modal, second visit stays closed until clicked, plus Opening Act & English switch', () => {
    // Simulate a brand-new 1st visit (no localStorage flag)
    window.localStorage.removeItem('app_lego_guide_seen_v1');
    const { unmount } = render(<App />);

    // 1. Guide & Concept Slides Modal auto-opens on 1st visit!
    expect(screen.getByTestId('guide-modal')).toBeInTheDocument();
    expect(screen.getByTestId('slide-deck-view')).toBeInTheDocument();

    // Navigate slides and tabs inside the first-visit modal
    fireEvent.click(screen.getByTestId('slide-next-btn'));
    expect(screen.getByTestId('slide-deck-view').textContent).toContain('Slide 2 / 4');

    fireEvent.click(screen.getByTestId('guide-tab-manual'));
    expect(screen.getByTestId('manual-view')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('guide-tab-architecture'));
    expect(screen.getByTestId('architecture-view')).toBeInTheDocument();

    // Close modal -> marks 'app_lego_guide_seen_v1' = 'true'
    fireEvent.click(screen.getByTestId('close-guide-modal-btn'));
    expect(screen.queryByTestId('guide-modal')).toBeNull();
    expect(window.localStorage.getItem('app_lego_guide_seen_v1')).toBe('true');

    // Unmount and mount again (simulate 2nd visit) -> Guide Modal must NOT auto-open!
    unmount();
    render(<App />);
    expect(screen.queryByTestId('guide-modal')).toBeNull();

    // User can open Guide Modal on demand anytime
    fireEvent.click(screen.getByTestId('open-guide-btn'));
    expect(screen.getByTestId('guide-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('guide-start-playing-btn'));
    expect(screen.queryByTestId('guide-modal')).toBeNull();

    // 2. Opening Act starts at step 0 (壱ノ型) -> advances on Send and Disconnect
    const banner = screen.getByTestId('opening-act-banner');
    expect(banner.getAttribute('data-tour-step')).toBe('0');

    fireEvent.click(screen.getByTestId('send-btn-msg-1'));
    expect(banner.getAttribute('data-tour-step')).toBe('1');

    fireEvent.click(screen.getByTestId('chip-disconnect-edge-1'));
    expect(banner.getAttribute('data-tour-step')).toBe('2');

    // 3. Switch language to English -> UI updates to English
    fireEvent.click(screen.getByTestId('lang-toggle-btn'));
    expect(banner.textContent).toContain('Act 3 of 3');
  });
});
