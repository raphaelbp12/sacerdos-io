import { describe, expect, it } from "vitest";
import {
  advanceDirection,
  approach,
  distance,
  frontMost,
  stepFor,
} from "./battlefield";
import { MOVE_SPEED } from "./tuning";

describe("advanceDirection", () => {
  it("party advances toward −x, enemy toward +x", () => {
    expect(advanceDirection("party")).toBe(-1);
    expect(advanceDirection("enemy")).toBe(1);
  });
});

describe("distance", () => {
  it("is the symmetric absolute gap", () => {
    expect(distance(10, 40)).toBe(30);
    expect(distance(40, 10)).toBe(30);
    expect(distance(5, 5)).toBe(0);
  });
});

describe("stepFor", () => {
  it("covers MOVE_SPEED units in one second", () => {
    expect(stepFor(1000)).toBe(MOVE_SPEED);
    expect(stepFor(100)).toBe(MOVE_SPEED / 10);
  });
});

describe("frontMost", () => {
  const units = [{ x: 300 }, { x: 320 }, { x: 280 }];

  it("party front is the smallest x (furthest left)", () => {
    expect(frontMost(units, "party")).toEqual({ x: 280 });
  });

  it("enemy front is the largest x (furthest right)", () => {
    expect(frontMost(units, "enemy")).toEqual({ x: 320 });
  });

  it("returns undefined for an empty side", () => {
    expect(frontMost([], "party")).toBeUndefined();
  });
});

describe("approach", () => {
  it("a melee unit (small range) closes nearly the whole gap", () => {
    // party at 300 moving toward an enemy at 0, range 10, big step.
    expect(approach(300, 0, 1000, 10)).toBe(10); // stops 10 short of the target
  });

  it("a ranged unit (large range) stops far from the target", () => {
    // same approach but with range 100 → stops 100 short.
    expect(approach(300, 0, 1000, 100)).toBe(100);
  });

  it("does not overshoot the stop point with a large step", () => {
    expect(approach(300, 0, 99999, 10)).toBe(10);
  });

  it("takes only one step when the step is small", () => {
    expect(approach(300, 0, 25, 10)).toBe(275);
  });

  it("works when the target is to the right (enemy moving +x)", () => {
    expect(approach(-100, 300, 1000, 10)).toBe(290); // stops 10 short of 300
  });

  it("stays put when already within range", () => {
    expect(approach(15, 0, 1000, 20)).toBe(15);
  });
});
