import { describe, it, expect } from "vitest";
import type { ModifierSource } from "../stats";
import { createCharacter } from "./create-character";
import { KNIGHT } from "./class-def";
import { Build } from "./skill-points";

describe("createCharacter", () => {
  it("derives base stats from class + level", () => {
    const c = createCharacter(KNIGHT, 10);
    expect(c.getStat("hp")).toBe(190);
    expect(c.getStat("attack")).toBe(19);
    expect(c.getStat("armor")).toBe(37);
    expect(c.level).toBe(10);
  });

  it("adds maxed passive bonuses on top of class stats", () => {
    const build = new Build(10);
    for (let i = 0; i < 10; i++) build.spend("attack"); // +20 attack
    const c = createCharacter(KNIGHT, 10, build);
    expect(c.getStat("attack")).toBe(19 + 20);
  });

  it("reflects live build edits (refund) on the next read", () => {
    const build = new Build(10);
    build.spend("attack"); // +2
    const c = createCharacter(KNIGHT, 10, build);
    expect(c.getStat("attack")).toBe(21);
    build.refund("attack");
    expect(c.getStat("attack")).toBe(19);
  });

  it("stacks extra modifier sources (e.g. equipment) on top", () => {
    const weapon: ModifierSource = {
      getModifiers: () => [{ attribute: "attack", kind: "flat", value: 5 }],
    };
    const c = createCharacter(KNIGHT, 1, undefined, [weapon]);
    expect(c.getStat("attack")).toBe(15); // 10 base + 5 weapon
  });
});
