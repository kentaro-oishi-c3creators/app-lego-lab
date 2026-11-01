# App LEGO PoC 1 — 「和モダン・からくり絵巻」＋ 体験型UX大改修 ウォークスルー

ご要望いただいた **「紹介スライド＆コンセプト絵」「いつでも飛べる図解・操作マニュアル」「実際に触って覚えるオープニングAct（体験ツアー）」「英語モード（English）」** をすべて追加実装し、実ブラウザ検証・全27件の自動テストが完了しました！

---

## 1. 新UX：紹介スライド・図解マニュアル・体験型オープニングAct・英語モード

````carousel
![秘伝指南書 ＆ 紹介スライド（全4枚）：描き下ろしの「和モダン・からくり絵巻」コンセプトアートと、ワンクリックで試せるアクションボタン](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-05-guide-slides-modal.png)
<!-- slide -->
![図解・操作マニュアル：水引の結び方・イベントの流れを示すSVG図解、3ステップ手順、全6種ブロック図鑑](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-06-visual-manual-diagram.png)
<!-- slide -->
![初陣・体験ガイド（Opening Act）：キャンバス上部に常駐し、「壱ノ型（Sendを押す）→ 弐ノ型（水引を切る・戻す）→ 参ノ型（五段連鎖）」を実際に触りながら3ステップで体得！](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-01-wa-modern-desktop.png)
<!-- slide -->
![英語モード（English Mode）＆ 初陣皆伝バッジ：右上の「🇬🇧 English / 🇯🇵 日本語」ボタン1つでUI全体を日英バイリンガル切替](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-07-english-mode.png)
<!-- slide -->
![スマートフォン完全対応（390×844 iPhone画面）：キャンバスがスマホ画面幅に自動フィット縮小され、下部アプリナビバー（指南書・工房召喚・戻す・URL共有）で片手操作可能](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-08-mobile-responsive.png)
````

---

## 2. 多段ピタゴラ連鎖・三連太鼓・からくり工房（実ブラウザ動作画面）

````carousel
![弐ノ巻：からくり五段連鎖（文 → 言霊フィルター「雅」 → からくり人形が和歌調吹き出しを出してジャンプ → 二秒の砂時計が自動起動 → 舞台開演）](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-02-karakuri-chain-speech.png)
<!-- slide -->
![参ノ巻：三連太鼓の奥義（3回「ワッショイ！」を叩いて満願成就・歌舞伎見得人形と千両花火舞台が同時発動）](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-03-taiko-combo-celebration.png)
<!-- slide -->
![からくり工房（JIDOKA 認定カスタムブロック召喚）：外部AI通信ゼロ・ローカル型安全検査の PASS 証跡と共に「千本桜からくり」を召喚](/C:/Users/kentaro.oishi/.gemini/antigravity/brain/8d719d09-484e-428a-bd75-603eda5bcf7c/poc1-04-karakuri-studio.png)
````

---

## 3. 追加したUX改善のポイント

1. **🎭 初陣・体験ガイド（Opening Act — 触って覚える3ステップ実践ツアー） ([App.tsx](file:///c:/Users/kentaro.oishi/ai_playGround/2611_app-lego-lab/src/app/App.tsx))**
   - 初回起動時、キャンバス上部に **「壱ノ型 (Step 1 / 3)：まずは『文』を送ってからくり人形を動かそう！」** が表示されます。
   - ユーザーが実際に `📨 Send` を押す（またはバナー内の **「⚡ 今すぐ送信を試す」** を押す）と自動的に **「弐ノ型（水引を切って戻す）」** へ進み、さらに切断/Undoを行うと **「参ノ型（五段連鎖を発動）」** へ進みます。3ステップ達成で **「💮 初陣皆伝！」** バッジが授与されます。
2. **📖 秘伝指南書 ＆ 紹介スライドモーダル ([GuideModal.tsx](file:///c:/Users/kentaro.oishi/ai_playGround/2611_app-lego-lab/src/components/GuideModal.tsx))**
   - ヘッダー左上の金色の **「📖 指南書・スライド」** ボタンからいつでも開けます。
   - **Tab 1（🎞️ 紹介スライド 全4枚）**：描き下ろしの「和モダン・からくり絵巻」コンセプトイラスト（[public/karakuri-concept-hero.jpg](file:///c:/Users/kentaro.oishi/ai_playGround/2611_app-lego-lab/public/karakuri-concept-hero.jpg)）と共に、コンセプト・基本3動作・多段連鎖・JIDOKA安全設計をスライド形式で解説。各スライドから1クリックで対応する巻物プリセットをキャンバスにロードできます。
   - **Tab 2（🧭 図解・操作マニュアル）**：「出力ポート `sent ●` ➔ 水引と言霊玉 ➔ 入力ポート `● jump`」を視覚化したSVG図解、3ステップ手順、全6種ブロック図鑑を掲載。
   - **Tab 3（🛡️ からくり図解・安全設計）**：5段ピタゴラ連鎖のフロー図と、JIDOKA 3重防護壁（`validateConnection` / `dispatchEvent` / `sanitizeGraph`）のアーキテクチャ図解。
3. **🌐 日英バイリンガル切替（`🇬🇧 English` / `🇯🇵 日本語`） ([i18n.ts](file:///c:/Users/kentaro.oishi/ai_playGround/2611_app-lego-lab/src/domain/i18n.ts))**
   - ヘッダーの **「🇬🇧 English / 🇯🇵 日本語」** ボタン1つで、タイトル・プリセット巻物・体験ツアー・紹介スライド・操作マニュアル・道具箱パレットまで即座に英語/日本語へ切り替わります。
