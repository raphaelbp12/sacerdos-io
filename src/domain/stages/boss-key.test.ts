import { describe, expect, it } from "vitest";
import {
  hasBossKeyFor,
  makeBossKey,
  settleBossKeyAfterFight,
} from "./boss-key";

describe("boss-key", () => {
  it("reports whether a key is held for an act", () => {
    const keys = [makeBossKey(1)];
    expect(hasBossKeyFor(keys, 1)).toBe(true);
    expect(hasBossKeyFor(keys, 2)).toBe(false);
  });

  it("keeps the key when the boss drops nothing", () => {
    const keys = [makeBossKey(1)];
    const after = settleBossKeyAfterFight(keys, 1, false);
    expect(after).toHaveLength(1);
    expect(hasBossKeyFor(after, 1)).toBe(true);
  });

  it("consumes one key when the boss drops something", () => {
    const keys = [makeBossKey(1)];
    const after = settleBossKeyAfterFight(keys, 1, true);
    expect(after).toHaveLength(0);
  });

  it("leaves keys for other acts untouched", () => {
    const keys = [makeBossKey(1), makeBossKey(2)];
    const after = settleBossKeyAfterFight(keys, 1, true);
    expect(after.map((k) => k.actIndex)).toEqual([2]);
  });

  it("does nothing if there is no key for the fought act", () => {
    const keys = [makeBossKey(2)];
    const after = settleBossKeyAfterFight(keys, 1, true);
    expect(after.map((k) => k.actIndex)).toEqual([2]);
  });
});
