import { describe, it, expect } from "vitest";
import { runeCostAt, RUNE_DEPTH_GROWTH, type RuneNode } from "./rune-node";

const makeNode = (over: Partial<RuneNode> = {}): RuneNode => ({
  id: "n",
  label: "Node",
  branch: 1,
  depth: 0,
  maxLevel: 10,
  baseCost: 100,
  effect: { kind: "stat", stat: "hp", modifierKind: "flat", perLevel: 10 },
  ...over,
});

describe("runeCostAt", () => {
  it("scales the first-level cost by baseCost at depth 0", () => {
    expect(runeCostAt(makeNode({ depth: 0 }), 0)).toBe(100);
  });

  it("strictly increases with depth (deeper steps cost more)", () => {
    const d0 = runeCostAt(makeNode({ depth: 0 }), 0);
    const d1 = runeCostAt(makeNode({ depth: 1 }), 0);
    const d2 = runeCostAt(makeNode({ depth: 2 }), 0);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
    expect(d1).toBe(Math.floor(100 * RUNE_DEPTH_GROWTH));
  });

  it("strictly increases with the level being bought", () => {
    const node = makeNode({ depth: 0 });
    const c1 = runeCostAt(node, 0);
    const c2 = runeCostAt(node, 1);
    const c3 = runeCostAt(node, 2);
    expect(c2).toBeGreaterThan(c1);
    expect(c3).toBeGreaterThan(c2);
    expect(c2).toBe(200);
    expect(c3).toBe(300);
  });

  it("rejects a level at or beyond maxLevel", () => {
    const node = makeNode({ maxLevel: 3 });
    expect(() => runeCostAt(node, 3)).toThrow(/max level/);
    expect(() => runeCostAt(node, 4)).toThrow(/max level/);
  });

  it("rejects a negative or non-integer level", () => {
    const node = makeNode();
    expect(() => runeCostAt(node, -1)).toThrow();
    expect(() => runeCostAt(node, 1.5)).toThrow();
  });
});
