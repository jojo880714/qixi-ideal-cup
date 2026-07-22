import type { Trait } from "@/data/traits";
import type { DuelPair, Zone } from "./types";

/**
 * Cross-zone pairing for the round of 8, mirroring the prototype exactly:
 * A1×B1, C1×D1, A2×B2, C2×D2 (index 0/1 = each zone's two survivors).
 */
export function buildInitialDuels(zones: Record<Zone, Trait[]>): DuelPair[] {
  const a = zones.A;
  const b = zones.B;
  const c = zones.C;
  const d = zones.D;
  return [
    [a[0]!, b[0]!],
    [c[0]!, d[0]!],
    [a[1]!, b[1]!],
    [c[1]!, d[1]!],
  ];
}
