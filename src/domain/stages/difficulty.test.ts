import { describe, expect, it } from "vitest";
import { DIFFICULTIES, difficultyById } from "./difficulty";

describe("difficulty", () => {
  it("offers normal and hard", () => {
    expect(DIFFICULTIES.map((d) => d.id)).toEqual(["normal", "hard"]);
  });

  it("normal is unlocked by default with no level bonuses", () => {
    const normal = difficultyById("normal");
    expect(normal.unlockedByDefault).toBe(true);
    expect(normal.itemLevelBonus).toBe(0);
    expect(normal.monsterLevelBonus).toBe(0);
  });

  it("hard is locked by default and raises item & monster level", () => {
    const hard = difficultyById("hard");
    expect(hard.unlockedByDefault).toBe(false);
    expect(hard.itemLevelBonus).toBeGreaterThan(0);
    expect(hard.monsterLevelBonus).toBeGreaterThan(0);
  });

  it("throws on an unknown difficulty id", () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => difficultyById("nightmare")).toThrow(/unknown difficulty/);
  });
});
