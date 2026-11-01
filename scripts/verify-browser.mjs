import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const repoRoot = 'c:/Users/kentaro.oishi/ai_playGround/2611_app-lego-lab';
const artifactsDir = path.join(repoRoot, 'artifacts');
const brainDir = 'C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function waitHttp(url, retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http
        .get(url, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode, body }));
        })
        .on('error', (err) => {
          if (n <= 0) return reject(err);
          setTimeout(() => attempt(n - 1), 250);
        });
    };
    attempt(retries);
  });
}

async function run() {
  const vitePort = 4176;
  const vite = spawn(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(vitePort),
      '--strictPort',
    ],
    { cwd: repoRoot, stdio: 'pipe' }
  );
  vite.stderr.on('data', (d) => console.error('[vite stderr]', d.toString()));

  const userDataDir = path.resolve(
    brainDir,
    'scratch',
    'chrome-profile-' + Date.now()
  );
  fs.mkdirSync(userDataDir, { recursive: true });
  const debugPort = 9236;

  let chrome;
  try {
    await waitHttp(`http://127.0.0.1:${vitePort}/`, 60);

    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        '--window-size=1280,860',
        `--remote-debugging-port=${debugPort}`,
        'about:blank',
      ],
      { stdio: 'pipe' }
    );

    const targetsRes = await waitHttp(`http://127.0.0.1:${debugPort}/json/list`, 80);
    const targets = JSON.parse(targetsRes.body);
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) {
      throw new Error('No page target found in Chrome CDP');
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    let msgId = 0;
    const pending = new Map();
    const consoleErrors = [];
    const pageExceptions = [];

    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      } else if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map((a) => a.value || a.description).join(' ');
        if (data.params.type === 'error') {
          consoleErrors.push(text);
        }
      } else if (data.method === 'Runtime.exceptionThrown') {
        pageExceptions.push(JSON.stringify(data.params.exceptionDetails));
      }
    });

    const sendCdp = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 860,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCdp('Page.navigate', { url: `http://127.0.0.1:${vitePort}/` });

    const evalJs = async (expression) => {
      const res = await sendCdp('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error('Eval exception: ' + JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    let mounted = false;
    for (let i = 0; i < 60; i++) {
      mounted = await evalJs(
        'Boolean(document.querySelector(\'[data-testid="send-btn-msg-1"]\'))'
      );
      if (mounted) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!mounted) {
      const html = await evalJs('document.body ? document.body.innerHTML : "no body"');
      console.error('Console errors:', consoleErrors);
      console.error('Page exceptions:', pageExceptions);
      console.error('Body HTML:', html);
      throw new Error('React app did not mount in headless Chrome');
    }

    const capturePng = async (filename) => {
      const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(shot.data, 'base64');
      const outPath = path.join(artifactsDir, filename);
      fs.writeFileSync(outPath, buf);
      fs.writeFileSync(path.join(brainDir, filename), buf);
      console.log('Saved screenshot:', outPath);
    };

    // 0. Verify First-Visit Auto-Open of Guide Modal, capture Slide Deck + Visual Manual, then close it!
    await evalJs(`(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 30; i++) {
        const img = document.querySelector('.concept-hero-img');
        if (img && img.complete && img.naturalWidth > 0) break;
        await wait(100);
      }
    })()`);
    await new Promise((r) => setTimeout(r, 150));
    await capturePng('poc1-05-guide-slides-modal.png');

    await evalJs(`document.querySelector('[data-testid="guide-tab-manual"]').click()`);
    await new Promise((r) => setTimeout(r, 150));
    await capturePng('poc1-06-visual-manual-diagram.png');

    await evalJs(`document.querySelector('[data-testid="guide-start-playing-btn"]').click()`);
    await new Promise((r) => setTimeout(r, 120));

    // 1. Capture initial Wa-Modern desktop state & verify G07 (no clipped primary controls at 1280x860)
    await capturePng('poc0-01-initial-desktop.png');
    await capturePng('poc1-01-wa-modern-desktop.png');

    const layoutCheck = await evalJs(`(() => {
      const ids = [
        'undo-btn',
        'empty-canvas-btn',
        'reset-demo-btn',
        'share-url-btn',
        'toggle-studio-btn',
        'preset-btn-poc0-basic',
        'preset-btn-karakuri-chain',
        'preset-btn-taiko-combo',
        'preset-btn-senbonzakura',
        'add-message-btn',
        'add-filter-btn',
        'add-counter-btn',
        'add-character-btn',
        'add-timer-btn',
        'add-media-btn',
        'send-btn-msg-1',
        'start-timer-btn-timer-1',
        'block-node-msg-1',
        'block-node-char-1',
        'block-node-timer-1',
        'block-node-media-1'
      ];
      const results = ids.map(id => {
        const el = document.querySelector('[data-testid="' + id + '"]');
        if (!el) return { id, missing: true };
        const r = el.getBoundingClientRect();
        const clipped = r.left < 0 || r.top < 0 || r.right > window.innerWidth || r.bottom > window.innerHeight || r.width === 0 || r.height === 0;
        return { id, left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height), clipped };
      });
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        allVisibleAndUnclipped: results.every(x => !x.missing && !x.clipped),
        controls: results
      };
    })()`);

    // 2. Click Send on msg-1 -> wait 80ms for React commit -> verify char-1 jumps
    await evalJs(`document.querySelector('[data-testid="send-btn-msg-1"]').click()`);
    await new Promise((r) => setTimeout(r, 100));
    const jumpResult = await evalJs(`(() => {
      const charEl = document.querySelector('[data-testid="character-body-char-1"]');
      return {
        jumping: charEl.getAttribute('data-jumping'),
        jumpCount: charEl.getAttribute('data-jump-count')
      };
    })()`);
    await capturePng('poc0-02-message-character-jump.png');

    // 3. Disconnect edge-1 -> Send -> verify no jump -> Undo -> Send -> verify jump
    const disconnectUndoResult = await evalJs(`(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('[data-testid="chip-disconnect-edge-1"]').click();
      await wait(60);
      document.querySelector('[data-testid="send-btn-msg-1"]').click();
      await wait(60);
      const charEl = document.querySelector('[data-testid="character-body-char-1"]');
      const countAfterDisconnectedSend = charEl.getAttribute('data-jump-count');
      document.querySelector('[data-testid="undo-btn"]').click();
      await wait(60);
      document.querySelector('[data-testid="send-btn-msg-1"]').click();
      await wait(60);
      const countAfterUndoAndSend = charEl.getAttribute('data-jump-count');
      return { countAfterDisconnectedSend, countAfterUndoAndSend };
    })()`);

    // 4. Trigger invalid connection warning (self-loop) even when clicked synchronously
    const invalidConnResult = await evalJs(`(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('[data-testid="port-msg-1-sent"]').click();
      document.querySelector('[data-testid="port-msg-1-sent"]').click();
      await wait(80);
      const banner = document.querySelector('[data-testid="warning-banner"]');
      return { warningText: banner ? banner.textContent : null };
    })()`);
    await capturePng('poc0-03-invalid-connection-warning.png');

    // 5. Switch to Preset 2: 弐ノ巻：からくり五段連鎖 & trigger 5-stage chain!
    await evalJs(`document.querySelector('[data-testid="preset-btn-karakuri-chain"]').click()`);
    await new Promise((r) => setTimeout(r, 120));
    await evalJs(`document.querySelector('[data-testid="send-btn-msg-1"]').click()`);
    await new Promise((r) => setTimeout(r, 150));
    await capturePng('poc1-02-karakuri-chain-speech.png');

    // Wait 2150ms for the 2s timer to finish and trigger media-1 in the 5-stage chain
    await new Promise((r) => setTimeout(r, 2150));
    const karakuriChainResult = await evalJs(`(() => {
      const charEl = document.querySelector('[data-testid="character-body-char-1"]');
      const speechEl = document.querySelector('[data-testid="character-speech-char-1"]');
      const mediaEl = document.querySelector('[data-testid="media-body-media-1"]');
      return {
        charJumpCount: charEl ? charEl.getAttribute('data-jump-count') : null,
        speechText: speechEl ? speechEl.textContent : null,
        mediaPlaying: mediaEl ? mediaEl.getAttribute('data-playing') : null,
        mediaPlayCount: mediaEl ? mediaEl.getAttribute('data-play-count') : null
      };
    })()`);

    // 6. Switch to Preset 3: 参ノ巻：三連太鼓の奥義 & hit 3 times!
    await evalJs(`document.querySelector('[data-testid="preset-btn-taiko-combo"]').click()`);
    await new Promise((r) => setTimeout(r, 120));
    await evalJs(`(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      document.querySelector('[data-testid="send-btn-msg-1"]').click();
      await wait(60);
      document.querySelector('[data-testid="send-btn-msg-1"]').click();
      await wait(60);
      document.querySelector('[data-testid="send-btn-msg-1"]').click();
      await wait(100);
    })()`);
    const taikoComboResult = await evalJs(`(() => {
      const charEl = document.querySelector('[data-testid="character-body-char-1"]');
      const mediaEl = document.querySelector('[data-testid="media-body-media-1"]');
      return {
        charJumpCount: charEl ? charEl.getAttribute('data-jump-count') : null,
        mediaPlaying: mediaEl ? mediaEl.getAttribute('data-playing') : null
      };
    })()`);
    await capturePng('poc1-03-taiko-combo-celebration.png');

    // 7. Open Karakuri Craft Studio (🧪 からくり工房), summon a custom block with JIDOKA PASS receipt, and capture screenshot
    await evalJs(`document.querySelector('[data-testid="toggle-studio-btn"]').click()`);
    await new Promise((r) => setTimeout(r, 100));
    await evalJs(`document.querySelector('[data-testid="craft-summon-btn"]').click()`);
    await new Promise((r) => setTimeout(r, 120));
    await capturePng('poc1-04-karakuri-studio.png');
    await evalJs(`document.querySelector('[data-testid="toggle-studio-btn"]').click()`);
    await new Promise((r) => setTimeout(r, 80));

    // 8. Switch to English Mode and capture screenshot
    await evalJs(`document.querySelector('[data-testid="lang-toggle-btn"]').click()`);
    await new Promise((r) => setTimeout(r, 120));
    await capturePng('poc1-07-english-mode.png');

    // Switch back to Japanese and test Smartphone Viewport (390x844 iPhone 14/15 Pro)
    await evalJs(`document.querySelector('[data-testid="lang-toggle-btn"]').click()`);
    await evalJs(`document.querySelector('[data-testid="preset-btn-poc0-basic"]').click()`);
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await evalJs(`window.dispatchEvent(new Event('resize'))`);
    await new Promise((r) => setTimeout(r, 200));
    await capturePng('poc1-08-mobile-responsive.png');

    const report = {
      timestamp: new Date().toISOString(),
      consoleErrors,
      pageExceptions,
      layoutCheck,
      jumpResult,
      disconnectUndoResult,
      invalidConnResult,
      karakuriChainResult,
      taikoComboResult,
    };

    const reportPath = path.join(artifactsDir, 'browser-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    ws.close();
  } finally {
    if (chrome) chrome.kill();
    vite.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
