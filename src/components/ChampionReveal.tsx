"use client";

import { useEffect, useMemo, useRef } from "react";

interface ChampionRevealProps {
  championTitle: string;
  /** 揭曉動畫結束後呼叫，交棒給結果卡。 */
  onDone: () => void;
}

const FULL_MS = 1400;
const REDUCED_MS = 400;
const PARTICLE_COUNT = 24;

interface Particle {
  style: React.CSSProperties;
}

/**
 * 冠軍揭曉「星等爆發」（Design Spec §05）：
 *   金環×2 擴散 → 24 顆金色星塵放射 → 冠軍卡 champPop → 「冠軍」章蓋下 → 1.4s 後交棒。
 * prefers-reduced-motion 時整體縮至 400ms（動畫本身由 globals.css 的 media query 降級）。
 */
export function ChampionReveal({ championTitle, onDone }: ChampionRevealProps) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      // Deterministic-ish spread from index so it looks even without RNG deps.
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = 90 + ((i * 37) % 120);
      const size = 3 + (i % 4);
      const delay = 0.35 + ((i * 11) % 25) / 100;
      const dur = 0.9 + ((i * 7) % 50) / 100;
      return {
        style: {
          width: `${size}px`,
          height: `${size}px`,
          background: i % 3 === 0 ? "var(--peach)" : "var(--gold)",
          // consumed by the `dust` keyframes
          ["--dx" as string]: `${Math.cos(angle) * dist}px`,
          ["--dy" as string]: `${Math.sin(angle) * dist}px`,
          animation: `dust ${dur}s ${delay}s var(--ease) both`,
        },
      };
    });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => doneRef.current(), reduceMotion ? REDUCED_MS : FULL_MS);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  return (
    <section className="screen" id="reveal">
      <div className="reveal">
        <div className="ring ring-1" aria-hidden="true" />
        <div className="ring ring-2" aria-hidden="true" />
        {!reduceMotion &&
          particles.map((p, i) => <span key={i} className="particle" style={p.style} aria-hidden="true" />)}
        <div className="champ-card" role="status">
          <p className="champ-eyebrow">天 字 第 一 號</p>
          <p className="champ-title">{championTitle}</p>
          <span className="champ-stamp" aria-hidden="true">
            冠軍
          </span>
        </div>
      </div>
    </section>
  );
}
