import { describe, expect, it } from "vitest";
import { TRAITS } from "@/data/traits";
import { InvalidResultSubmissionError, resolveTraitTitle, validateResultSubmission } from "./results";

const soulTrait = TRAITS.find((t) => t.type === "soul")!;
const otherSoulTraits = TRAITS.filter((t) => t.type === "soul" && t.id !== soulTrait.id).slice(0, 3);
const validFinalFour = [soulTrait.id, ...otherSoulTraits.map((t) => t.id)];

describe("validateResultSubmission", () => {
  it("accepts a well-formed submission and derives personaKey from championId", () => {
    const result = validateResultSubmission({
      mode: 128,
      championId: soulTrait.id,
      finalFourIds: validFinalFour,
    });
    expect(result).toEqual({
      mode: 128,
      championId: soulTrait.id,
      finalFourIds: validFinalFour,
      personaKey: "soul",
    });
  });

  it("rejects a non-object body", () => {
    expect(() => validateResultSubmission(null)).toThrow(InvalidResultSubmissionError);
    expect(() => validateResultSubmission("hi")).toThrow(InvalidResultSubmissionError);
  });

  it("rejects an invalid mode", () => {
    expect(() =>
      validateResultSubmission({ mode: 32, championId: soulTrait.id, finalFourIds: validFinalFour }),
    ).toThrow(/mode/);
  });

  it("rejects an unknown championId", () => {
    expect(() =>
      validateResultSubmission({ mode: 128, championId: "not-a-real-id", finalFourIds: validFinalFour }),
    ).toThrow(/championId/);
  });

  it("rejects finalFourIds with the wrong length", () => {
    expect(() =>
      validateResultSubmission({ mode: 128, championId: soulTrait.id, finalFourIds: [soulTrait.id] }),
    ).toThrow(/finalFourIds/);
  });

  it("rejects finalFourIds containing an unknown id", () => {
    expect(() =>
      validateResultSubmission({
        mode: 128,
        championId: soulTrait.id,
        finalFourIds: [soulTrait.id, "bogus", otherSoulTraits[0]!.id, otherSoulTraits[1]!.id],
      }),
    ).toThrow(/finalFourIds/);
  });

  it("rejects duplicate ids in finalFourIds", () => {
    expect(() =>
      validateResultSubmission({
        mode: 128,
        championId: soulTrait.id,
        finalFourIds: [soulTrait.id, soulTrait.id, otherSoulTraits[0]!.id, otherSoulTraits[1]!.id],
      }),
    ).toThrow(/distinct/);
  });

  it("rejects when finalFourIds[0] does not match championId", () => {
    const reordered = [...validFinalFour.slice(1), soulTrait.id];
    expect(() =>
      validateResultSubmission({ mode: 128, championId: soulTrait.id, finalFourIds: reordered }),
    ).toThrow(/finalFourIds\[0\]/);
  });
});

describe("resolveTraitTitle", () => {
  it("resolves a known trait id to its title", () => {
    expect(resolveTraitTitle(soulTrait.id)).toBe(soulTrait.title);
  });

  it("returns a placeholder for an unknown id", () => {
    expect(resolveTraitTitle("nope")).toBe("（未知條件）");
  });
});
