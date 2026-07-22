"use client";

import { useState } from "react";
import type { GroupItem } from "@/lib/engine";

interface GroupScreenProps {
  group: GroupItem;
  groupNumberInRound: number;
  groupCountInRound: number;
  progressPct: number;
  onConfirm: (selectedIndices: number[]) => void;
  onOverPick: () => void;
}

/** Renders one 4-選-2 / 8-選-2 group screen. Remount with a fresh `key` per group so selection state resets. */
export function GroupScreen({
  group,
  groupNumberInRound,
  groupCountInRound,
  progressPct,
  onConfirm,
  onOverPick,
}: GroupScreenProps) {
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(i: number) {
    // Reads `selected` from the closure rather than a functional updater —
    // calling `onOverPick` (which updates GameApp's toast state) from
    // inside a setState updater triggers React's "Cannot update a
    // component while rendering a different component" warning, since
    // updater functions are expected to be pure and may be invoked outside
    // a normal event-handler context (e.g. twice under Strict Mode).
    if (selected.includes(i)) {
      setSelected(selected.filter((x) => x !== i));
      return;
    }
    if (selected.length >= group.pick) {
      onOverPick();
      return;
    }
    setSelected([...selected, i]);
  }

  return (
    <section className="screen" id="group">
      <span className="stage-tag">{group.stage}</span>
      <p className="group-title">{group.label}</p>
      <p className="group-sub">
        本輪第 {groupNumberInRound} 組 / 共 {groupCountInRound} 組
      </p>
      <div className="progress">
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <p className="pick-hint">
        {group.items.length} 個條件，留下你最在意的 {group.pick} 個
      </p>
      <div className="grid">
        {group.items.map((trait, i) => (
          <button
            key={trait.id}
            className={`trait-card${selected.includes(i) ? " sel" : ""}`}
            onClick={() => toggle(i)}
          >
            {trait.title}
          </button>
        ))}
      </div>
      <button
        className="confirm"
        disabled={selected.length !== group.pick}
        onClick={() => onConfirm(selected)}
      >
        確認晉級 →
      </button>
    </section>
  );
}
