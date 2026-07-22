import { describe, expect, it } from "vitest";
import type { Trait } from "@/data/traits";
import { buildInitialDuels } from "./duelStage";
import type { Zone } from "./types";

function trait(id: string): Trait {
  return { id, title: id, type: "soul" };
}

describe("buildInitialDuels", () => {
  it("pairs cross-zone: A1xB1, C1xD1, A2xB2, C2xD2", () => {
    const zones: Record<Zone, Trait[]> = {
      A: [trait("A1"), trait("A2")],
      B: [trait("B1"), trait("B2")],
      C: [trait("C1"), trait("C2")],
      D: [trait("D1"), trait("D2")],
    };
    const duels = buildInitialDuels(zones);
    expect(duels).toEqual([
      [trait("A1"), trait("B1")],
      [trait("C1"), trait("D1")],
      [trait("A2"), trait("B2")],
      [trait("C2"), trait("D2")],
    ]);
  });
});
