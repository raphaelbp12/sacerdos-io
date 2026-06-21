import { describe, expect, it } from "vitest";
import {
  advance,
  isDifficultyUnlocked,
  isFinalStage,
  retreat,
} from "./progression";

describe("progression", () => {
  it("advances stage by stage within an act", () => {
    expect(advance({ actIndex: 1, stageIndex: 1 })).toEqual({
      actIndex: 1,
      stageIndex: 2,
    });
  });

  it("advances from the last stage of an act into the next act", () => {
    expect(advance({ actIndex: 1, stageIndex: 9 })).toEqual({
      actIndex: 2,
      stageIndex: 1,
    });
  });

  it("caps advance at the final stage of the final act", () => {
    const final = { actIndex: 2, stageIndex: 9 };
    expect(isFinalStage(final)).toBe(true);
    expect(advance(final)).toEqual(final);
  });

  it("retreats stage by stage and never below act 1 stage 1", () => {
    expect(retreat({ actIndex: 1, stageIndex: 3 })).toEqual({
      actIndex: 1,
      stageIndex: 2,
    });
    expect(retreat({ actIndex: 1, stageIndex: 1 })).toEqual({
      actIndex: 1,
      stageIndex: 1,
    });
  });

  it("retreats from the first stage of an act into the previous act", () => {
    expect(retreat({ actIndex: 2, stageIndex: 1 })).toEqual({
      actIndex: 1,
      stageIndex: 9,
    });
  });

  it("locks hard until the normal final act boss is cleared", () => {
    expect(isDifficultyUnlocked("normal", false)).toBe(true);
    expect(isDifficultyUnlocked("hard", false)).toBe(false);
    expect(isDifficultyUnlocked("hard", true)).toBe(true);
  });
});
