import { describe, it, expect } from "vitest";
import { drainSteps, MAX_STEPS_PER_FRAME } from "./useClockLoop";

describe("drainSteps", () => {
  it("drains whole fixed steps and keeps the remainder", () => {
    expect(drainSteps(250, 100)).toEqual({ steps: 2, remainder: 50 });
  });

  it("yields no steps when the accumulator is below one step", () => {
    expect(drainSteps(40, 100)).toEqual({ steps: 0, remainder: 40 });
  });

  it("treats an exact multiple as whole steps with zero remainder", () => {
    expect(drainSteps(300, 100)).toEqual({ steps: 3, remainder: 0 });
  });

  it("caps the steps per frame so a long pause cannot freeze the loop", () => {
    const huge = (MAX_STEPS_PER_FRAME + 50) * 100;
    const { steps, remainder } = drainSteps(huge, 100);
    expect(steps).toBe(MAX_STEPS_PER_FRAME);
    expect(remainder).toBe(50 * 100);
  });

  it("is a no-op for non-positive input", () => {
    expect(drainSteps(0, 100)).toEqual({ steps: 0, remainder: 0 });
    expect(drainSteps(100, 0)).toEqual({ steps: 0, remainder: 100 });
  });
});
