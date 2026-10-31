import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

describe('App LEGO UI Integration — Gates G04 & G05', () => {
  beforeEach(() => {
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

    // Perform rapid synchronous native .click() calls inside one act() block:
    // 1) Send while connected (jumpCount -> 1)
    // 2) Disconnect edge-1
    // 3) Send again in the SAME synchronous tick (must see disconnected state via historyRef and stay 1)
    // 4) Click port-msg-1-sent twice in the SAME synchronous tick (must trigger SELF_LOOP via pendingPortRef)
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
});
