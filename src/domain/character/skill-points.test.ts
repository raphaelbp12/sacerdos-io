import { describe, it, expect } from "vitest";
import { Character } from "../stats";
import { Build } from "./skill-points";

describe("Build — skill-point allocation", () => {
  it("grants exactly one point per level", () => {
    expect(new Build(1).availablePoints).toBe(1);
    expect(new Build(10).availablePoints).toBe(10);
  });

  it("spending raises the node rank and lowers available points", () => {
    const b = new Build(5);
    b.spend("attack");
    expect(b.rankOf("attack")).toBe(1);
    expect(b.availablePoints).toBe(4);
  });

  it("blocks spending beyond earned points", () => {
    const b = new Build(2);
    b.spend("attack");
    b.spend("attack");
    expect(() => b.spend("attack")).toThrow(/no skill points/i);
  });

  it("rejects a band-locked node", () => {
    const b = new Build(5); // only band 1 unlocked
    expect(() => b.spend("elemental-resist")).toThrow(/lock/i); // band 4
  });

  it("allows a node once its band unlocks", () => {
    const b = new Build(31); // band 4 unlocked
    b.spend("elemental-resist");
    expect(b.rankOf("elemental-resist")).toBe(1);
  });

  it("caps a node at its max rank", () => {
    const b = new Build(40);
    for (let i = 0; i < 5; i++) b.spend("elemental-resist"); // max 5
    expect(b.rankOf("elemental-resist")).toBe(5);
    expect(() => b.spend("elemental-resist")).toThrow(/max rank/i);
  });

  it("refunds a point, restoring the pool and lowering the rank", () => {
    const b = new Build(5);
    b.spend("attack");
    b.spend("attack");
    b.refund("attack");
    expect(b.rankOf("attack")).toBe(1);
    expect(b.availablePoints).toBe(4);
  });

  it("rejects refunding a node with zero rank", () => {
    const b = new Build(5);
    expect(() => b.refund("attack")).toThrow(/no ranks/i);
  });

  it("rejects unknown node ids", () => {
    const b = new Build(5);
    expect(() => b.spend("nonsense")).toThrow(/unknown/i);
  });

  it("treats skills as spendable nodes too", () => {
    const b = new Build(1);
    b.spend("smash"); // band 1 skill
    expect(b.rankOf("smash")).toBe(1);
  });

  it("projects passive ranks into a PassiveAllocation usable by a Character", () => {
    const b = new Build(40);
    b.spend("attack");
    b.spend("attack");
    const c = new Character({}, [b.toPassiveAllocation()]);
    expect(c.getStat("attack")).toBe(4);
  });
});
