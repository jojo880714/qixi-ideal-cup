import { describe, expect, it } from "vitest";
import { mulberry32, shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns a permutation of the input (same elements, same length)", () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const out = shuffle(input, mulberry32(42));
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input, mulberry32(1));
    expect(input).toEqual(copy);
  });

  it("is deterministic for a given rng seed", () => {
    const input = Array.from({ length: 30 }, (_, i) => i);
    const a = shuffle(input, mulberry32(7));
    const b = shuffle(input, mulberry32(7));
    expect(a).toEqual(b);
  });

  it("produces different orders for different seeds (overwhelmingly likely)", () => {
    const input = Array.from({ length: 30 }, (_, i) => i);
    const a = shuffle(input, mulberry32(1));
    const b = shuffle(input, mulberry32(2));
    expect(a).not.toEqual(b);
  });
});

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const r1 = mulberry32(123);
    const r2 = mulberry32(123);
    const seq1 = Array.from({ length: 5 }, () => r1());
    const seq2 = Array.from({ length: 5 }, () => r2());
    expect(seq1).toEqual(seq2);
  });

  it("produces values in [0, 1)", () => {
    const r = mulberry32(999);
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
