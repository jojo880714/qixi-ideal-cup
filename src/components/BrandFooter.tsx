/**
 * Joysee 品牌 footer — 固定出現在每個畫面最下方（Design Spec 00／03）。
 * 使用合作方提供的 Joysee 標誌（public/joysee-logo.png，已去背裁切）。
 */
export function BrandFooter() {
  return (
    <div className="brand-footer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="joysee-logo-img" src="/joysee-logo.png" alt="Joysee Travel.tw｜揪西歡玩" />
    </div>
  );
}
