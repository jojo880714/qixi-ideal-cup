import { describe, expect, it } from "vitest";
import { FACTION_KEYS, TRAITS } from "@/data/traits";
import { PERSONAS } from "@/data/personas";
import {
  getGameResult,
  initGame,
  submitDuelPick,
  submitGroupPick,
} from "./engine";
import { mulberry32 } from "./shuffle";
import type { GameState, Mode } from "./types";

/** Plays a full game deterministically, always picking the first `pick`/2 indices. Returns the finished state. */
function playThrough(mode: Mode, seed: number): GameState {
  let state = initGame(mode, TRAITS, mulberry32(seed));
  let guard = 0;
  while (state.phase !== "result") {
    if (guard++ > 1000) throw new Error("playThrough did not terminate");
    if (state.phase === "group") {
      const group = state.groupQueue[state.groupIdx]!;
      const indices = Array.from({ length: group.pick }, (_, i) => i);
      state = submitGroupPick(state, indices);
    } else {
      state = submitDuelPick(state, 0);
    }
  }
  return state;
}

describe("initGame", () => {
  it("128 mode: splits all 128 unique traits into 4 zones of 32", () => {
    const state = initGame(128, TRAITS, mulberry32(1));
    const all = [...state.zones.A, ...state.zones.B, ...state.zones.C, ...state.zones.D];
    expect(state.zones.A).toHaveLength(32);
    expect(state.zones.B).toHaveLength(32);
    expect(state.zones.C).toHaveLength(32);
    expect(state.zones.D).toHaveLength(32);
    expect(new Set(all.map((t) => t.id)).size).toBe(128);
  });

  it("64 mode: splits 64 traits (8 per faction) into 4 zones of 16", () => {
    const state = initGame(64, TRAITS, mulberry32(2));
    const all = [...state.zones.A, ...state.zones.B, ...state.zones.C, ...state.zones.D];
    expect(all).toHaveLength(64);
    expect(new Set(all.map((t) => t.id)).size).toBe(64);
    for (const faction of FACTION_KEYS) {
      expect(all.filter((t) => t.type === faction)).toHaveLength(8);
    }
  });

  it("starts in the group phase with the round-1 queue already built", () => {
    const state = initGame(128, TRAITS, mulberry32(3));
    expect(state.phase).toBe("group");
    expect(state.roundNumber).toBe(1);
    expect(state.groupQueue).toHaveLength(32);
    expect(state.groupQueue[0]!.stage).toBe("初賽・128 取 64");
  });

  it("throws if given a trait pool that isn't exactly 128 items for 128 mode", () => {
    expect(() => initGame(128, TRAITS.slice(0, 100), mulberry32(1))).toThrow();
  });
});

describe("full playthrough", () => {
  it("128 mode reaches a result after exactly the expected number of picks", () => {
    const state = playThrough(128, 10);
    expect(state.phase).toBe("result");
    expect(state.stepsDone).toBe(state.stepsTotal);
    expect(state.stepsTotal).toBe(32 + 16 + 4 + 7);
  });

  it("64 mode reaches a result after exactly the expected number of picks", () => {
    const state = playThrough(64, 11);
    expect(state.phase).toBe("result");
    expect(state.stepsDone).toBe(state.stepsTotal);
    expect(state.stepsTotal).toBe(16 + 4 + 7);
  });

  it("produces a valid result with a champion, runner-up and 4 distinct final-four traits", () => {
    const state = playThrough(128, 99);
    const result = getGameResult(state);
    expect(result.champion.id).not.toBe(result.runnerUp.id);
    expect(result.finalFour).toHaveLength(4);
    expect(result.finalFour[0]!.id).toBe(result.champion.id);
    expect(result.finalFour[1]!.id).toBe(result.runnerUp.id);
    expect(new Set(result.finalFour.map((t) => t.id)).size).toBe(4);
    expect(PERSONAS[result.championKey]).toBeDefined();
  });

  it("is deterministic: same seed produces the same champion", () => {
    const r1 = getGameResult(playThrough(128, 555));
    const r2 = getGameResult(playThrough(128, 555));
    expect(r1.champion.id).toBe(r2.champion.id);
    expect(r1.finalFour.map((t) => t.id)).toEqual(r2.finalFour.map((t) => t.id));
  });
});

describe("submitGroupPick validation", () => {
  it("throws when the wrong number of indices is submitted", () => {
    const state = initGame(128, TRAITS, mulberry32(4));
    expect(() => submitGroupPick(state, [0])).toThrow();
    expect(() => submitGroupPick(state, [0, 1, 2])).toThrow();
  });

  it("throws on duplicate indices", () => {
    const state = initGame(128, TRAITS, mulberry32(4));
    expect(() => submitGroupPick(state, [0, 0])).toThrow();
  });

  it("throws when called outside the group phase", () => {
    const state = playThrough(128, 1);
    expect(() => submitGroupPick(state, [0, 1])).toThrow();
  });
});

describe("submitDuelPick validation", () => {
  it("throws when called outside the duel phase", () => {
    const state = initGame(128, TRAITS, mulberry32(5));
    expect(() => submitDuelPick(state, 0)).toThrow();
  });
});

describe("getGameResult", () => {
  it("throws if the game has not finished", () => {
    const state = initGame(128, TRAITS, mulberry32(6));
    expect(() => getGameResult(state)).toThrow();
  });
});
