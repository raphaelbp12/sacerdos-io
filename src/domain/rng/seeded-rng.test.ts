import { describe, it, expect } from "vitest";
import { SeededRng } from "./seeded-rng";

describe("SeededRng", () => {
  describe("determinism", () => {
    it("produces the same nextFloat sequence for the same seed", () => {
      const a = new SeededRng(42);
      const b = new SeededRng(42);
      for (let i = 0; i < 20; i++) {
        expect(a.nextFloat()).toBe(b.nextFloat());
      }
    });

    it("produces the same nextInt sequence for the same seed", () => {
      const a = new SeededRng(99);
      const b = new SeededRng(99);
      for (let i = 0; i < 20; i++) {
        expect(a.nextInt(0, 100)).toBe(b.nextInt(0, 100));
      }
    });

    it("diverges for different seeds", () => {
      const a = new SeededRng(1);
      const b = new SeededRng(2);
      const valuesA = Array.from({ length: 10 }, () => a.nextFloat());
      const valuesB = Array.from({ length: 10 }, () => b.nextFloat());
      expect(valuesA).not.toEqual(valuesB);
    });
  });

  describe("nextFloat range", () => {
    it("always returns a value in [0, 1)", () => {
      const rng = new SeededRng(12345);
      for (let i = 0; i < 1000; i++) {
        const v = rng.nextFloat();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("nextInt range", () => {
    it("always returns a value within [min, max] inclusive", () => {
      const rng = new SeededRng(7);
      for (let i = 0; i < 1000; i++) {
        const v = rng.nextInt(3, 10);
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(10);
      }
    });

    it("handles edge case where min === max", () => {
      const rng = new SeededRng(0);
      for (let i = 0; i < 10; i++) {
        expect(rng.nextInt(5, 5)).toBe(5);
      }
    });

    it("returns integer values", () => {
      const rng = new SeededRng(55);
      for (let i = 0; i < 100; i++) {
        expect(Number.isInteger(rng.nextInt(0, 50))).toBe(true);
      }
    });
  });

  describe("regression lock (known seed → known sequence)", () => {
    it("seed 1 first nextFloat matches the known mulberry32 output", () => {
      const rng = new SeededRng(1);
      // Value captured from mulberry32 and locked here.
      // If this test fails, the PRNG algorithm was changed — verify intentionally.
      expect(rng.nextFloat()).toBe(0.6270739405881613);
    });
  });
});
