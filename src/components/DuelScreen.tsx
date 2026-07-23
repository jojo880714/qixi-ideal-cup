"use client";

import { useState } from "react";
import type { DuelPair } from "@/lib/engine";
import { BrandFooter } from "./BrandFooter";

interface DuelScreenProps {
  pair: DuelPair;
  /** 0 = 8 強對決, 1 = 準決賽, 2 = 冠軍戰 */
  stageIdx: number;
  duelNumberInStage: number;
  duelCountInStage: number;
  onPick: (side: 0 | 1) => void;
}

// UI 賽段標籤（依 Design Spec §3.3 張力遞增；冠軍戰標籤加「・最終決定」）。
const STAGE_LABELS = ["8 強對決", "準決賽", "冠軍戰・最終決定"];
// 敗者卡 fadeDim 時間，與 globals.css fadeDim 動畫對齊。
const LOSER_FADE_MS = 180;

export function DuelScreen({ pair, stageIdx, duelNumberInStage, duelCountInStage, onPick }: DuelScreenProps) {
  const [loserSide, setLoserSide] = useState<0 | 1 | null>(null);

  function handlePick(side: 0 | 1) {
    if (loserSide !== null) return; // already deciding
    setLoserSide((side === 0 ? 1 : 0) as 0 | 1);
    window.setTimeout(() => onPick(side), LOSER_FADE_MS);
  }

  const label = STAGE_LABELS[stageIdx] ?? STAGE_LABELS[0];
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className={`screen duel stage-${stageIdx}`} id="duel">
      <span className={`stage-tag${stageIdx === 2 ? " tag-final" : ""}`} aria-live="polite">
        {label}
      </span>
      <p className="group-sub">
        第 {duelNumberInStage} 場 / 共 {duelCountInStage} 場
      </p>
      <p className="pick-hint">如果只能留一個，你選——</p>
      <div className="battle">
        <button
          className={`duel-card${loserSide === 0 && !reduceMotion ? " loser" : ""}`}
          onClick={() => handlePick(0)}
        >
          <span className="t">{pair[0].title}</span>
        </button>
        <p className="vs">V S</p>
        <button
          className={`duel-card${loserSide === 1 && !reduceMotion ? " loser" : ""}`}
          onClick={() => handlePick(1)}
        >
          <span className="t">{pair[1].title}</span>
        </button>
      </div>
      <BrandFooter />
    </section>
  );
}
