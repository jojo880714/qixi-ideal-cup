import type { Trait } from "@/data/traits";
import type { GroupItem, Zone } from "./types";
import { ZONES } from "./types";

/**
 * Builds the list of group-pick screens for one round, given each zone's
 * current surviving pool. Mirrors the prototype's `nextGroupRound` queue
 * construction exactly:
 * - zone size 8 → one "分區決賽" group per zone, pick 2 out of 8
 * - otherwise → zone split into groups of 4, pick 2 out of 4 each
 */
export function buildGroupQueue(
  zones: Record<Zone, Trait[]>,
  roundNumber: number,
): GroupItem[] {
  const size = zones.A.length;
  const total = size * 4;

  let stageName: string;
  if (size === 8) {
    stageName = "分區決賽・32 取 8";
  } else if (roundNumber === 1) {
    stageName = `初賽・${total} 取 ${total / 2}`;
  } else {
    stageName = `複賽・${total} 取 ${total / 2}`;
  }

  const queue: GroupItem[] = [];

  if (size === 8) {
    for (const z of ZONES) {
      queue.push({
        zone: z,
        label: `${z} 區決賽`,
        items: zones[z],
        pick: 2,
        stage: stageName,
      });
    }
    return queue;
  }

  const groupsPerZone = size / 4;
  for (const z of ZONES) {
    for (let i = 0; i < groupsPerZone; i++) {
      queue.push({
        zone: z,
        label: `${z}-${i + 1} 組`,
        items: zones[z].slice(i * 4, (i + 1) * 4),
        pick: 2,
        stage: stageName,
      });
    }
  }
  return queue;
}
