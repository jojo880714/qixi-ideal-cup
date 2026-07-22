import { TRAITS, type FactionKey } from "@/data/traits";
import type { Mode } from "@/lib/engine";

const TRAIT_BY_ID = new Map(TRAITS.map((t) => [t.id, t]));

export class InvalidResultSubmissionError extends Error {}

export interface ValidatedResultSubmission {
  mode: Mode;
  championId: string;
  finalFourIds: string[];
  personaKey: FactionKey;
}

/**
 * Validates a POST /api/results body. The client computes its own result
 * (there's no server-side re-simulation of the full pick history — this is
 * an anonymous fun quiz, not a system with anything at stake), so this is
 * an integrity check, not a full replay: every id must be a real trait,
 * the final four must be 4 distinct known ids, and — critically —
 * `personaKey` is never taken from the client. It's always derived from
 * `championId`'s trait, so a client can't submit a mismatched persona.
 */
export function validateResultSubmission(body: unknown): ValidatedResultSubmission {
  if (typeof body !== "object" || body === null) {
    throw new InvalidResultSubmissionError("Request body must be a JSON object");
  }
  const { mode, championId, finalFourIds } = body as Record<string, unknown>;

  if (mode !== 64 && mode !== 128) {
    throw new InvalidResultSubmissionError("mode must be 64 or 128");
  }
  if (typeof championId !== "string" || !TRAIT_BY_ID.has(championId)) {
    throw new InvalidResultSubmissionError("championId is not a known trait id");
  }
  if (
    !Array.isArray(finalFourIds) ||
    finalFourIds.length !== 4 ||
    !finalFourIds.every((id): id is string => typeof id === "string" && TRAIT_BY_ID.has(id))
  ) {
    throw new InvalidResultSubmissionError("finalFourIds must be 4 known trait ids");
  }
  if (new Set(finalFourIds).size !== 4) {
    throw new InvalidResultSubmissionError("finalFourIds must be 4 distinct trait ids");
  }
  if (finalFourIds[0] !== championId) {
    throw new InvalidResultSubmissionError("finalFourIds[0] must equal championId");
  }

  const championTrait = TRAIT_BY_ID.get(championId)!;
  return {
    mode,
    championId,
    finalFourIds: finalFourIds as string[],
    personaKey: championTrait.type,
  };
}

export function resolveTraitTitle(id: string): string {
  return TRAIT_BY_ID.get(id)?.title ?? "（未知條件）";
}
