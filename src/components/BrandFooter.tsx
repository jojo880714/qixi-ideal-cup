/**
 * Joysee 品牌 footer — 固定出現在每個畫面最下方（Design Spec 00／03）。
 *
 * ⚠ PLACEHOLDER：這裡是「揪西歡玩 Joysee Travel.tw」合作方的標誌位置，但我們
 * 手上沒有對方的官方 logo 圖檔，所以先用文字佔位、不擅自仿造真實品牌識別。
 * 收到 assets/joysee-logo.png 後，只要把下面 <span className="joysee-logo">…
 * 這段換成 <img src="/joysee-logo.png" .../> 即可，其餘版位不需改。
 */
export function BrandFooter() {
  return (
    <div className="brand-footer">
      <span className="joysee-logo" aria-label="Joysee 揪西歡玩（合作方標誌佔位）">
        <span className="joysee-mark" aria-hidden="true">
          J
        </span>
        揪西歡玩
        <span className="joysee-sub">Joysee Travel.tw</span>
      </span>
    </div>
  );
}
