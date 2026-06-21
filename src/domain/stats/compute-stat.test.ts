import { describe, it, expect } from "vitest";
import { computeStat } from "./compute-stat";
import type { Modifier } from "./modifier";

describe("computeStat", () => {
  // Step 2.1 — base-only
  it("returns base when there are no modifiers", () => {
    expect(computeStat(10, [])).toBe(10);
  });

  // Step 2.2 — flat modifiers
  it("adds a single flat modifier to the base", () => {
    const mods: Modifier[] = [{ attribute: "attack", kind: "flat", value: 5 }];
    expect(computeStat(10, mods)).toBe(15);
  });

  it("stacks multiple flat modifiers", () => {
    const mods: Modifier[] = [
      { attribute: "attack", kind: "flat", value: 5 },
      { attribute: "attack", kind: "flat", value: 3 },
    ];
    expect(computeStat(10, mods)).toBe(18);
  });

  // Step 2.3 — percentage modifiers
  it("applies a single percentage modifier multiplicatively", () => {
    const mods: Modifier[] = [
      { attribute: "attack", kind: "percentage", value: 0.1 },
    ];
    expect(computeStat(10, mods)).toBe(11);
  });

  it("compounds two percentage modifiers multiplicatively", () => {
    const mods: Modifier[] = [
      { attribute: "attack", kind: "percentage", value: 0.1 },
      { attribute: "attack", kind: "percentage", value: 0.1 },
    ];
    // 10 * 1.1 * 1.1 = 12.1
    expect(computeStat(10, mods)).toBeCloseTo(12.1);
  });

  // Step 2.4 — locked order: flat before percentage
  it("applies flat modifiers before percentage modifiers (locked order)", () => {
    const mods: Modifier[] = [
      { attribute: "attack", kind: "flat", value: 5 },
      { attribute: "attack", kind: "percentage", value: 0.1 },
    ];
    // (10 + 5) * 1.1 = 16.5, NOT (10 * 1.1) + 5 = 16.0
    expect(computeStat(10, mods)).toBeCloseTo(16.5);
  });
});
