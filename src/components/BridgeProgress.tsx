/**
 * 鵲橋星點進度 — 取代進度條。固定 9 顆星點沿橋排列：
 *   已完成 = gold 實星 ✦（光暈）／當前 = peach 放大 ✦／未完成 = 暗紫圓點 ·
 * 依整體 stepsDone / stepsTotal 對映到 0..9 顆完成。
 */

const DOT_COUNT = 9;

export function BridgeProgress({ stepsDone, stepsTotal }: { stepsDone: number; stepsTotal: number }) {
  const ratio = stepsTotal > 0 ? Math.min(1, stepsDone / stepsTotal) : 0;
  const doneDots = Math.min(DOT_COUNT, Math.round(ratio * DOT_COUNT));

  return (
    <div className="bridge" role="progressbar" aria-valuemin={0} aria-valuemax={stepsTotal} aria-valuenow={stepsDone}>
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const state = i < doneDots ? "dot-done" : i === doneDots ? "dot-cur" : "dot-future";
        const isStar = state !== "dot-future";
        return (
          <span key={i} className={state} aria-hidden="true">
            {isStar ? "✦" : "·"}
          </span>
        );
      })}
    </div>
  );
}
