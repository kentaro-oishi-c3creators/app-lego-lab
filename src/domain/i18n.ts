export type Locale = 'ja' | 'en';

export interface OpeningActStepText {
  stepBadge: string;
  title: string;
  instruction: string;
  hint: string;
  actionButtonLabel?: string;
}

export const UI_TEXT = {
  ja: {
    brandTitle: 'App LEGO からくり絵巻 — 和モダン工房',
    brandSubtitle:
      '水引で言霊とからくりを結び、連鎖と舞を紡ぐローカル完結・型安全イベントパズル',
    toolbar: {
      guide: '📖 指南書・スライド',
      guideAria: '操作マニュアルと紹介スライドを開く (Guide & Slides)',
      tour: '🎭 序幕ツアー',
      tourAria: '体験型チュートリアル（序幕ツアー）を開始・再開する',
      studio: '🧪 からくり工房',
      share: '🔗 絵巻URL共有',
      undoPrefix: '↩️ Undo (戻す)',
      empty: '🧹 Empty (白紙)',
      reset: '🔄 Reset (初期化)',
      langSwitch: '🇬🇧 English',
      langSwitchAria: '英語モードに切り替え (Switch to English)',
    },
    presetBarLabel: '📜 絵巻プリセット:',
    presets: {
      'poc0-basic': {
        title: '📜 壱ノ巻：基本の二対',
        subtitle: 'Message → Character / Timer → Media',
      },
      'karakuri-chain': {
        title: '🎎 弐ノ巻：からくり五段連鎖',
        subtitle: '文 → 言霊 → 人形 → 砂時計 → 舞台',
      },
      'taiko-combo': {
        title: '🥁 参ノ巻：三連太鼓の奥義',
        subtitle: '3回叩くと人形と花火が同時発動！',
      },
      senbonzakura: {
        title: '🌸 肆ノ巻：千本桜・一斉演舞',
        subtitle: '1つの文から3つの舞台が一斉に舞う',
      },
    },
    openingAct: {
      bannerTag: '🎭 初陣・体験ガイド (Opening Act)',
      skipBtn: '自由に遊ぶ (閉じる)',
      openSlidesBtn: '📖 図解スライドを見る',
      restartBtn: '🔄 最初から体験',
      completedBadge: '💮 初陣皆伝！すべての基本操作を体得しました',
      completedSub:
        '上部の「📜 絵巻プリセット」や左の「🧰 からくり道具箱」から自由にブロックを繋ぎ替えて遊んでみましょう！',
      steps: [
        {
          stepBadge: '壱ノ型 (Step 1 / 3)',
          title: 'まずは「文（Message）」を送ってからくり人形を動かそう！',
          instruction:
            'キャンバス左上の青いブロック「文（メッセージ）」にある金枠で光っている【📨 Send (送信)】ボタンを押してみてください。',
          hint: '💡 水引（赤い線）を通って金色の言霊玉が走り、右の「からくり人形」がジャンプします！',
          actionButtonLabel: '⚡ 今すぐ送信を試す',
        },
        {
          stepBadge: '弐ノ型 (Step 2 / 3)',
          title: '水引を「✂️ 切断」して、もう一度「↩️ Undo（戻す）」を試そう！',
          instruction:
            'ブロックの間の水引にある【✂️ 切断】ボタンを押してから Send を押すと人形が動かなくなります。その後、右上の【↩️ Undo (戻す)】を押して復活させてみましょう！',
          hint: '💡 「線を切ると反応が止まり、Undoでいつでも元に戻せる」ので安心して実験できます。',
          actionButtonLabel: '✂️ 水引を切ってみる',
        },
        {
          stepBadge: '参ノ型 (Step 3 / 3)',
          title: 'クライマックス！「🎎 弐ノ巻：からくり五段連鎖」を発動しよう！',
          instruction:
            '上部の【🎎 弐ノ巻：からくり五段連鎖】を選び、【📨 Send (送信)】を押して「文 → 言霊変換 → 人形ジャンプ → 砂時計起動 → 舞台開演」のピタゴラ連鎖を見届けましょう！',
          hint: '💡 砂時計が2秒カウントダウンした後に、右下の舞台が自動的に開演します！',
          actionButtonLabel: '🎎 弐ノ巻を開いて発火！',
        },
      ] as OpeningActStepText[],
    },
    toybox: {
      title: '🧰 からくり道具箱 (Toybox)',
      hint: 'クリックで絵巻へ配置。右側の出力ポート [●] から左側の入力ポート [●] へ水引を結んで連鎖させましょう。',
      eventLogTitle: '📖 からくり過去帳 (Event Log)',
      emptyLog: 'まだ記録がありません。ブロックの Send や Start Timer を押してみましょう。',
    },
    connectionHint: {
      idle: '💡 結び方：ブロック右側の【出力ポート ●】をクリックし、別ブロック左側の【入力ポート ●】をクリックすると水引が結ばれます。',
      pendingPrefix: '🧵 水引選択中:',
      pendingSuffix:
        '→ 結びたいブロック左側の【入力ポート ●】をクリックしてください',
      cancelBtn: '選択解除',
    },
  },
  en: {
    brandTitle: 'App LEGO Karakuri Emaki — Wa-Modern Craft Lab',
    brandSubtitle:
      'Connect words & Karakuri puppets with Mizuhiki cords — a local, type-safe interactive event puzzle',
    toolbar: {
      guide: '📖 Guide & Slides',
      guideAria: 'Open visual operation manual and concept slide deck',
      tour: '🎭 Intro Tour',
      tourAria: 'Start or restart the interactive hands-on tutorial',
      studio: '🧪 Craft Studio',
      share: '🔗 Share URL',
      undoPrefix: '↩️ Undo',
      empty: '🧹 Empty',
      reset: '🔄 Reset',
      langSwitch: '🇯🇵 日本語',
      langSwitchAria: 'Switch language to Japanese (日本語に切り替え)',
    },
    presetBarLabel: '📜 Story Scrolls:',
    presets: {
      'poc0-basic': {
        title: '📜 Scroll I: Basic Pairs',
        subtitle: 'Message → Character / Timer → Media',
      },
      'karakuri-chain': {
        title: '🎎 Scroll II: 5-Stage Rube Goldberg',
        subtitle: 'Message → Filter → Puppet → Timer → Stage',
      },
      'taiko-combo': {
        title: '🥁 Scroll III: 3-Hit Taiko Combo',
        subtitle: 'Hit the drum 3 times to trigger Puppet + Fireworks!',
      },
      senbonzakura: {
        title: '🌸 Scroll IV: Senbonzakura Fan-Out',
        subtitle: '1 Message triggers 3 stages simultaneously',
      },
    },
    openingAct: {
      bannerTag: '🎭 Opening Act (Hands-On Tutorial)',
      skipBtn: 'Free Play (Hide)',
      openSlidesBtn: '📖 Concept Slides & Manual',
      restartBtn: '🔄 Restart Tour',
      completedBadge: '💮 Mastered! You completed the 3-step Opening Act!',
      completedSub:
        'Switch between Story Scrolls above or add blocks from the Toybox on the left to invent your own chains!',
      steps: [
        {
          stepBadge: 'Act 1 of 3',
          title: 'Press "Send" on the Message block to make the Karakuri puppet jump!',
          instruction:
            'Click the glowing blue [📨 Send] button inside the top-left Message block (msg-1) on the Washi canvas.',
          hint: '💡 Watch a golden orb travel along the Mizuhiki cord and make the puppet jump!',
          actionButtonLabel: '⚡ Fire "Send" Now',
        },
        {
          stepBadge: 'Act 2 of 3',
          title: 'Cut the Mizuhiki cord (✂️) and bring it back with Undo (↩️)!',
          instruction:
            'Click the [✂️ 切断 (Cut)] button on the cord between Message and Puppet, then click [↩️ Undo] in the top bar to restore it!',
          hint: '💡 Disconnecting stops event flow immediately, and Undo safely restores any step.',
          actionButtonLabel: '✂️ Cut Cord Now',
        },
        {
          stepBadge: 'Act 3 of 3',
          title: 'Finale! Experience the 5-Stage Rube Goldberg Chain (Scroll II)!',
          instruction:
            'Click [🎎 Scroll II: 5-Stage Rube Goldberg] in the scroll bar above, then press [📨 Send] to watch all 5 blocks chain together!',
          hint: '💡 Message → Kotodama Filter → Puppet Jump → 2s Hourglass → Festival Stage!',
          actionButtonLabel: '🎎 Load Scroll II & Fire!',
        },
      ] as OpeningActStepText[],
    },
    toybox: {
      title: '🧰 Karakuri Toybox (Palette)',
      hint: 'Click to place on the scroll. Connect a right Output port [●] to a left Input port [●] to build chains.',
      eventLogTitle: '📖 Karakuri Event Log',
      emptyLog: 'No events yet. Press Send or Start Timer on any block.',
    },
    connectionHint: {
      idle: '💡 How to Wire: Click an [Output port ●] on the right side of a block, then click an [Input port ●] on the left side of another block.',
      pendingPrefix: '🧵 Wiring from:',
      pendingSuffix: '→ Click a compatible [Input port ●] on another block',
      cancelBtn: 'Cancel',
    },
  },
} as const;
