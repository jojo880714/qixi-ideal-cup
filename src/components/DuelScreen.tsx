import type { DuelPair } from "@/lib/engine";

interface DuelScreenProps {
  pair: DuelPair;
  stageLabel: string;
  duelNumberInStage: number;
  duelCountInStage: number;
  progressPct: number;
  onPick: (side: 0 | 1) => void;
}

export function DuelScreen({
  pair,
  stageLabel,
  duelNumberInStage,
  duelCountInStage,
  progressPct,
  onPick,
}: DuelScreenProps) {
  return (
    <section className="screen" id="duel">
      <span className="stage-tag">{stageLabel}</span>
      <p className="group-sub">
        第 {duelNumberInStage} 場 / 共 {duelCountInStage} 場
      </p>
      <div className="progress">
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <p className="pick-hint">如果只能留一個，你選——</p>
      <div className="battle">
        <button className="duel-card" onClick={() => onPick(0)}>
          <span className="t">{pair[0].title}</span>
        </button>
        <p className="vs">V S</p>
        <button className="duel-card" onClick={() => onPick(1)}>
          <span className="t">{pair[1].title}</span>
        </button>
      </div>
    </section>
  );
}
