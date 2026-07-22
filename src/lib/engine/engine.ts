import { FACTION_KEYS, type Trait } from "@/data/traits";
import { buildGroupQueue } from "./groupStage";
import { buildInitialDuels } from "./duelStage";
import { type Rng, shuffle } from "./shuffle";
import {
  DUEL_STAGE_LABELS,
  type DuelPair,
  type GameResult,
  type GameState,
  type Mode,
  type Zone,
  ZONES,
} from "./types";

function emptyZones(): Record<Zone, Trait[]> {
  return { A: [], B: [], C: [], D: [] };
}

/**
 * Builds the shuffled trait pool a game starts from.
 * - 128 mode: shuffle all 128 traits.
 * - 64 mode: take 8 (shuffled) traits per faction — 8 factions × 8 = 64 — then
 *   shuffle the combined list, so every faction is represented evenly.
 */
function buildTraitPool(mode: Mode, allTraits: Trait[], rng: Rng): Trait[] {
  if (mode === 128) {
    if (allTraits.length !== 128) {
      throw new Error(`128 mode requires exactly 128 traits, got ${allTraits.length}`);
    }
    return shuffle(allTraits, rng);
  }
  const picked: Trait[] = [];
  for (const faction of FACTION_KEYS) {
    const factionTraits = allTraits.filter((t) => t.type === faction);
    picked.push(...shuffle(factionTraits, rng).slice(0, 8));
  }
  return shuffle(picked, rng);
}

function startDuelPhase(state: GameState, zones: Record<Zone, Trait[]>): GameState {
  const duels = buildInitialDuels(zones);
  return {
    ...state,
    zones,
    phase: "duel",
    duels,
    duelIdx: 0,
    duelStageIdx: 0,
    duelWinners: [],
    finalFour: [],
    runnerUp: null,
    champion: null,
  };
}

/** Either starts the next group round, or transitions to the duel phase once each zone is down to 2. */
function advanceGroupPhase(
  state: GameState,
  zones: Record<Zone, Trait[]>,
  roundNumber: number,
): GameState {
  const size = zones.A.length;
  if (size <= 2) {
    return startDuelPhase(state, zones);
  }
  const nextRound = roundNumber + 1;
  const queue = buildGroupQueue(zones, nextRound);
  return {
    ...state,
    zones,
    roundNumber: nextRound,
    groupQueue: queue,
    groupIdx: 0,
    zoneWinners: emptyZones(),
  };
}

export function initGame(mode: Mode, allTraits: Trait[], rng: Rng = Math.random): GameState {
  const pool = buildTraitPool(mode, allTraits, rng);
  const per = pool.length / 4;
  const zones = emptyZones();
  ZONES.forEach((z, i) => {
    zones[z] = pool.slice(i * per, (i + 1) * per);
  });

  const stepsTotal = (mode === 128 ? 32 + 16 + 4 : 16 + 4) + 7;

  const base: GameState = {
    mode,
    phase: "group",
    zones,
    roundNumber: 0,
    groupQueue: [],
    groupIdx: 0,
    zoneWinners: emptyZones(),
    duels: [],
    duelIdx: 0,
    duelStageIdx: 0,
    duelWinners: [],
    finalFour: [],
    runnerUp: null,
    champion: null,
    stepsDone: 0,
    stepsTotal,
  };

  return advanceGroupPhase(base, zones, 0);
}

/** Submits the user's pick for the currently active group screen. `selectedIndices` are indices into that group's `items`. */
export function submitGroupPick(state: GameState, selectedIndices: number[]): GameState {
  if (state.phase !== "group") {
    throw new Error("submitGroupPick called outside of group phase");
  }
  const group = state.groupQueue[state.groupIdx];
  if (!group) throw new Error("No active group to submit a pick for");
  if (selectedIndices.length !== group.pick) {
    throw new Error(`Expected ${group.pick} selections, got ${selectedIndices.length}`);
  }
  if (new Set(selectedIndices).size !== selectedIndices.length) {
    throw new Error("Duplicate selection indices");
  }
  const picked = selectedIndices.map((i) => {
    const t = group.items[i];
    if (!t) throw new Error(`Invalid selection index ${i}`);
    return t;
  });

  const zoneWinners: Record<Zone, Trait[]> = {
    A: state.zoneWinners.A.slice(),
    B: state.zoneWinners.B.slice(),
    C: state.zoneWinners.C.slice(),
    D: state.zoneWinners.D.slice(),
  };
  zoneWinners[group.zone].push(...picked);

  const stepsDone = state.stepsDone + 1;
  const groupIdx = state.groupIdx + 1;
  const withProgress: GameState = { ...state, stepsDone, groupIdx, zoneWinners };

  if (groupIdx >= state.groupQueue.length) {
    return advanceGroupPhase(withProgress, zoneWinners, state.roundNumber);
  }
  return withProgress;
}

/** Submits the user's pick (0 = left card, 1 = right card) for the currently active duel. */
export function submitDuelPick(state: GameState, side: 0 | 1): GameState {
  if (state.phase !== "duel") {
    throw new Error("submitDuelPick called outside of duel phase");
  }
  const pair = state.duels[state.duelIdx];
  if (!pair) throw new Error("No active duel to submit a pick for");

  const winner = pair[side];
  const loser = pair[1 - side] as Trait;
  const runnerUp = state.duelStageIdx === 2 ? loser : state.runnerUp;
  const duelWinners = [...state.duelWinners, winner];
  const stepsDone = state.stepsDone + 1;
  const duelIdx = state.duelIdx + 1;

  if (duelIdx < state.duels.length) {
    return { ...state, duelWinners, stepsDone, duelIdx, runnerUp };
  }

  if (state.duelStageIdx === 0) {
    const finalFour = duelWinners.slice();
    const duels: DuelPair[] = [
      [finalFour[0]!, finalFour[1]!],
      [finalFour[2]!, finalFour[3]!],
    ];
    return {
      ...state,
      stepsDone,
      finalFour,
      duels,
      duelIdx: 0,
      duelStageIdx: 1,
      duelWinners: [],
      runnerUp,
    };
  }

  if (state.duelStageIdx === 1) {
    const duels: DuelPair[] = [[duelWinners[0]!, duelWinners[1]!]];
    return {
      ...state,
      stepsDone,
      duels,
      duelIdx: 0,
      duelStageIdx: 2,
      duelWinners: [],
      runnerUp,
    };
  }

  // duelStageIdx === 2: championship duel just decided
  const champion = duelWinners[0]!;
  return {
    ...state,
    stepsDone,
    phase: "result",
    champion,
    runnerUp,
    duelWinners: [],
  };
}

export function getDuelStageLabel(state: GameState): string {
  return DUEL_STAGE_LABELS[state.duelStageIdx] ?? DUEL_STAGE_LABELS[0];
}

/** Computes the final result once `state.phase === "result"`. Throws otherwise. */
export function getGameResult(state: GameState): GameResult {
  if (state.phase !== "result" || !state.champion || !state.runnerUp) {
    throw new Error("Game is not finished yet");
  }
  const { champion, runnerUp, finalFour } = state;
  const others = finalFour.filter((t) => t.id !== champion.id && t.id !== runnerUp.id);
  const four = [champion, runnerUp, ...others].slice(0, 4);
  return {
    championKey: champion.type,
    champion,
    runnerUp,
    finalFour: four,
  };
}
