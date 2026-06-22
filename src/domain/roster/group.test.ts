import { describe, expect, it } from "vitest";
import { TrainingDummy } from "../combat";
import { PARTY_START_X, StageRunner, UNIT_SPACING } from "../battle";
import { monsterById, scaleMonster } from "../monsters";
import { SeededRng } from "../rng";
import type { RosterMember } from "./roster";
import { Roster } from "./roster";
import {
  DEFAULT_FORMATION_CAPACITY,
  DEFAULT_GROUP_SLOTS,
  Group,
  GroupRoster,
} from "./group";

function member(id: string): RosterMember {
  return { id, combatant: new TrainingDummy(id, { hp: 1000 }) };
}

function rosterOf(...ids: string[]): Roster {
  const roster = new Roster(ids.length);
  ids.forEach((id) => roster.add(member(id)));
  return roster;
}

describe("Group formation", () => {
  it("defaults to the formation capacity", () => {
    expect(new Group("g1").capacity).toBe(DEFAULT_FORMATION_CAPACITY);
  });

  it("appends members to the back, front-to-back", () => {
    const group = new Group("g1");
    group.add("a");
    group.add("b");
    group.add("c");
    expect(group.formation).toEqual(["a", "b", "c"]);
  });

  it("rejects duplicates and respects the formation capacity", () => {
    const group = new Group("g1", 2);
    expect(group.add("a")).toBe(true);
    expect(group.add("a")).toBe(false);
    expect(group.add("b")).toBe(true);
    expect(group.add("c")).toBe(false);
    expect(group.formation).toEqual(["a", "b"]);
  });

  it("moves a member to reorder the formation", () => {
    const group = new Group("g1");
    group.add("a");
    group.add("b");
    group.add("c");
    expect(group.move("c", 0)).toBe(true);
    expect(group.formation).toEqual(["c", "a", "b"]);
    expect(group.move("missing", 0)).toBe(false);
  });

  it("removes a member from the formation", () => {
    const group = new Group("g1");
    group.add("a");
    group.add("b");
    expect(group.remove("a")).toBe(true);
    expect(group.formation).toEqual(["b"]);
    expect(group.remove("a")).toBe(false);
  });
});

describe("Group → battle formation order", () => {
  it("builds the party in formation order", () => {
    const roster = rosterOf("a", "b", "c");
    const group = new Group("g1");
    group.add("a");
    group.add("b");
    group.add("c");
    expect(group.buildParty(roster).map((u) => u.name)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("skips formation members no longer in the roster", () => {
    const roster = rosterOf("a", "c");
    const group = new Group("g1");
    group.add("a");
    group.add("b"); // never owned
    group.add("c");
    expect(group.buildParty(roster).map((u) => u.name)).toEqual(["a", "c"]);
  });

  it("drives battlefield positions: formation index 0 is the front line", () => {
    const roster = rosterOf("a", "b", "c");
    const group = new Group("g1");
    group.add("a");
    group.add("b");
    group.add("c");
    group.move("c", 0); // reorder: c, a, b

    const wave = [scaleMonster(monsterById("goblin-grunt"), 1, ["physical"])];
    const runner = new StageRunner(
      group.buildParty(roster),
      [wave],
      new SeededRng(1),
    );

    // StageRunner.spawnWave assigns x = PARTY_START_X + i * UNIT_SPACING by index.
    expect(runner.party.map((u) => u.name)).toEqual(["c", "a", "b"]);
    runner.party.forEach((u, i) => {
      expect(u.x).toBe(PARTY_START_X + i * UNIT_SPACING);
    });
    // The front-most party member (min x) is the formation's index-0 character.
    const front = runner.party.reduce((f, u) => (u.x < f.x ? u : f));
    expect(front.name).toBe("c");
  });
});

describe("GroupRoster", () => {
  it("defaults to the group-slot capacity", () => {
    expect(new GroupRoster().capacity).toBe(DEFAULT_GROUP_SLOTS);
  });

  it("adds, gets, and reports membership", () => {
    const groups = new GroupRoster(2);
    const g1 = new Group("g1");
    expect(groups.add(g1)).toBe(true);
    expect(groups.has("g1")).toBe(true);
    expect(groups.get("g1")).toBe(g1);
    expect(groups.groups).toEqual([g1]);
  });

  it("rejects duplicates and blocks the (capacity + 1)-th group", () => {
    const groups = new GroupRoster(1);
    expect(groups.add(new Group("g1"))).toBe(true);
    expect(groups.add(new Group("g1"))).toBe(false);
    expect(groups.add(new Group("g2"))).toBe(false);
    expect(groups.size).toBe(1);
  });

  it("removes a group and frees a slot", () => {
    const groups = new GroupRoster(1);
    groups.add(new Group("g1"));
    expect(groups.remove("g1")).toBe(true);
    expect(groups.add(new Group("g2"))).toBe(true);
  });
});
