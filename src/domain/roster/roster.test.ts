import { describe, expect, it } from "vitest";
import { TrainingDummy } from "../combat";
import type { RosterMember } from "./roster";
import { DEFAULT_HERO_SLOTS, Roster } from "./roster";

function member(id: string): RosterMember {
  return { id, combatant: new TrainingDummy(id) };
}

describe("Roster", () => {
  it("defaults to the hero-slot capacity", () => {
    expect(new Roster().capacity).toBe(DEFAULT_HERO_SLOTS);
  });

  it("adds, gets, and reports membership", () => {
    const roster = new Roster();
    const knight = member("knight");
    expect(roster.add(knight)).toBe(true);
    expect(roster.has("knight")).toBe(true);
    expect(roster.get("knight")).toBe(knight);
    expect(roster.size).toBe(1);
    expect(roster.members).toEqual([knight]);
  });

  it("keeps members in insertion order", () => {
    const roster = new Roster();
    roster.add(member("a"));
    roster.add(member("b"));
    roster.add(member("c"));
    expect(roster.members.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("rejects a duplicate id without mutating", () => {
    const roster = new Roster();
    roster.add(member("knight"));
    expect(roster.add(member("knight"))).toBe(false);
    expect(roster.size).toBe(1);
  });

  it("blocks the (capacity + 1)-th distinct member", () => {
    const roster = new Roster(2);
    expect(roster.add(member("a"))).toBe(true);
    expect(roster.add(member("b"))).toBe(true);
    expect(roster.add(member("c"))).toBe(false);
    expect(roster.size).toBe(2);
  });

  it("removes a member and frees a slot", () => {
    const roster = new Roster(2);
    roster.add(member("a"));
    roster.add(member("b"));
    expect(roster.remove("a")).toBe(true);
    expect(roster.has("a")).toBe(false);
    expect(roster.add(member("c"))).toBe(true);
    expect(roster.remove("missing")).toBe(false);
  });
});
