import type { FactionKey, Trait } from "@/data/traits";

export type Mode = 64 | 128;
export type Zone = "A" | "B" | "C" | "D";
export const ZONES: Zone[] = ["A", "B", "C", "D"];

export type Phase = "group" | "duel" | "result";

/** 一組待選擇的分組（分組賽 4 選 2，或分區決賽 8 選 2）。 */
export interface GroupItem {
  zone: Zone;
  label: string;
  items: Trait[];
  pick: number;
  /** 顯示用賽段名稱，如「初賽・128 取 64」「分區決賽・32 取 8」。 */
  stage: string;
}

export type DuelPair = [Trait, Trait];

export const DUEL_STAGE_LABELS = ["8 強對決", "準決賽", "冠軍戰"] as const;

export interface GameState {
  mode: Mode;
  phase: Phase;

  /** 目前各區尚存的條件池（分組賽階段使用）。 */
  zones: Record<Zone, Trait[]>;
  roundNumber: number;
  groupQueue: GroupItem[];
  groupIdx: number;
  zoneWinners: Record<Zone, Trait[]>;

  /** 1v1 淘汰賽階段。 */
  duels: DuelPair[];
  duelIdx: number;
  duelStageIdx: number; // 0 = 8強對決, 1 = 準決賽, 2 = 冠軍戰
  duelWinners: Trait[];
  finalFour: Trait[];
  runnerUp: Trait | null;
  champion: Trait | null;

  stepsDone: number;
  stepsTotal: number;
}

export interface GameResult {
  championKey: FactionKey;
  champion: Trait;
  runnerUp: Trait;
  /** 冠軍、亞軍、其餘兩位四強，依序，長度固定為 4。 */
  finalFour: Trait[];
}
