import { describe, expect, it } from "vitest";
import type { Trait } from "@/data/traits";
import { buildGroupQueue } from "./groupStage";
import type { Zone } from "./types";

function makeZones(size: number): Record<Zone, Trait[]> {
  const make = (zone: string) =>
    Array.from({ length: size }, (_, i) => ({
      id: `${zone}-${i}`,
      title: `${zone}-trait-${i}`,
      type: "soul" as const,
    }));
  return { A: make("A"), B: make("B"), C: make("C"), D: make("D") };
}

describe("buildGroupQueue", () => {
  it("splits a 32-item zone into 8 groups of 4, labeled 初賽 on round 1", () => {
    const queue = buildGroupQueue(makeZones(32), 1);
    expect(queue).toHaveLength(32); // 8 groups * 4 zones
    expect(queue.every((g) => g.items.length === 4 && g.pick === 2)).toBe(true);
    expect(queue[0]!.stage).toBe("初賽・128 取 64");
    expect(queue[0]!.label).toBe("A-1 組");
  });

  it("labels round 2+ as 複賽", () => {
    const queue = buildGroupQueue(makeZones(16), 2);
    expect(queue).toHaveLength(16); // 4 groups * 4 zones
    expect(queue[0]!.stage).toBe("複賽・64 取 32");
  });

  it("treats zone size 8 as a single 分區決賽 group per zone (8 選 2)", () => {
    const queue = buildGroupQueue(makeZones(8), 3);
    expect(queue).toHaveLength(4); // one group per zone
    expect(queue.every((g) => g.items.length === 8 && g.pick === 2)).toBe(true);
    expect(queue.every((g) => g.stage === "分區決賽・32 取 8")).toBe(true);
    expect(queue.map((g) => g.label)).toEqual(["A 區決賽", "B 區決賽", "C 區決賽", "D 區決賽"]);
  });

  it("64-mode round 1 (zone size 16) is also labeled 初賽", () => {
    const queue = buildGroupQueue(makeZones(16), 1);
    expect(queue[0]!.stage).toBe("初賽・64 取 32");
  });
});
