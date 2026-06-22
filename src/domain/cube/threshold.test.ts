import { describe, it, expect } from "vitest";
import { THRESHOLDS, withinThreshold, type Threshold } from "./threshold";

describe("THRESHOLDS", () => {
  it("lists the overview bands in order", () => {
    expect(THRESHOLDS).toEqual([
      { min: 1, max: 10 },
      { min: 10, max: 15 },
      { min: 15, max: 30 },
      { min: 30, max: 40 },
      { min: 50, max: 60 },
    ]);
  });
});

describe("withinThreshold", () => {
  const band: Threshold = { min: 10, max: 15 };

  it("is inclusive on both ends", () => {
    expect(withinThreshold(10, band)).toBe(true);
    expect(withinThreshold(15, band)).toBe(true);
  });

  it("rejects levels below or above the band", () => {
    expect(withinThreshold(9, band)).toBe(false);
    expect(withinThreshold(16, band)).toBe(false);
  });
});
