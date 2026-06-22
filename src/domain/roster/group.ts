/**
 * Groups & the group roster (M19).
 *
 * A {@link Group} is an **ordered formation** — a list of {@link RosterMember} ids,
 * front-to-back — that the player arranges. `buildParty(roster)` turns the formation,
 * in order, into `BattleUnit`s on the `"party"` side; `StageRunner.spawnWave` then
 * assigns each unit its `x` by index, so formation order *is* battlefield order (no
 * new positioning code). {@link GroupRoster} is the collection of owned groups, capped
 * by the account's *group slots* (default {@link DEFAULT_GROUP_SLOTS}, grown by runes).
 *
 * One-way deps: `roster → battle` (for `BattleUnit`) `→ combat`. Capacities are plain
 * numbers, injected, so this module never imports `runes`.
 */

import { BattleUnit } from "../battle";
import type { Roster, RosterMember } from "./roster";

/** Default number of groups the player may own (overview: 1, expandable). */
export const DEFAULT_GROUP_SLOTS = 1;

/** Default maximum characters a single group may field (placeholder — D-034). */
export const DEFAULT_FORMATION_CAPACITY = 5;

/** An ordered formation of owned characters (by id), front (index 0) to back. */
export class Group {
  declare readonly id: string;
  private readonly order: string[] = [];
  declare private readonly _capacity: number;

  constructor(id: string, capacity: number = DEFAULT_FORMATION_CAPACITY) {
    this.id = id;
    this._capacity = capacity;
  }

  /** Maximum characters this group may field. */
  get capacity(): number {
    return this._capacity;
  }

  /** Number of characters currently in the formation. */
  get size(): number {
    return this.order.length;
  }

  /** The formation as member ids, front-to-back. */
  get formation(): readonly string[] {
    return [...this.order];
  }

  /** Whether `memberId` is in the formation. */
  has(memberId: string): boolean {
    return this.order.includes(memberId);
  }

  /**
   * Appends `memberId` to the back of the formation. Returns `false` (no mutation)
   * when the group is full or the member is already in it; `true` on success.
   */
  add(memberId: string): boolean {
    if (this.order.includes(memberId)) return false;
    if (this.order.length >= this._capacity) return false;
    this.order.push(memberId);
    return true;
  }

  /** Removes `memberId` from the formation. Returns whether it was present. */
  remove(memberId: string): boolean {
    const idx = this.order.indexOf(memberId);
    if (idx === -1) return false;
    this.order.splice(idx, 1);
    return true;
  }

  /**
   * Moves `memberId` to `toIndex` (clamped to `[0, size - 1]`), shifting the rest.
   * Returns `false` when the member is not in the formation; `true` on success.
   */
  move(memberId: string, toIndex: number): boolean {
    const from = this.order.indexOf(memberId);
    if (from === -1) return false;
    const to = Math.max(0, Math.min(toIndex, this.order.length - 1));
    this.order.splice(from, 1);
    this.order.splice(to, 0, memberId);
    return true;
  }

  /**
   * Builds the battle party from this formation, in order: each present member becomes
   * a `"party"` `BattleUnit` at placeholder `x = 0` (the stage runner repositions by
   * index). Members no longer in the roster are skipped.
   */
  buildParty(roster: Roster): BattleUnit[] {
    const party: BattleUnit[] = [];
    for (const id of this.order) {
      const m: RosterMember | undefined = roster.get(id);
      if (!m) continue;
      party.push(
        new BattleUnit(
          m.combatant,
          "party",
          0,
          m.skills ?? [],
          m.attackElement ?? "physical",
        ),
      );
    }
    return party;
  }
}

/** The player's owned groups, capped by group slots. */
export class GroupRoster {
  private readonly groupsById = new Map<string, Group>();
  declare private readonly _capacity: number;

  constructor(capacity: number = DEFAULT_GROUP_SLOTS) {
    this._capacity = capacity;
  }

  /** Maximum number of groups the player may own. */
  get capacity(): number {
    return this._capacity;
  }

  /** Number of groups currently owned. */
  get size(): number {
    return this.groupsById.size;
  }

  /** Owned groups in insertion order. */
  get groups(): readonly Group[] {
    return [...this.groupsById.values()];
  }

  /** Whether `id` is owned. */
  has(id: string): boolean {
    return this.groupsById.has(id);
  }

  /** The owned group for `id`, or `undefined`. */
  get(id: string): Group | undefined {
    return this.groupsById.get(id);
  }

  /**
   * Adds `group`. Returns `false` (no mutation) when full or the id is already owned;
   * `true` on success.
   */
  add(group: Group): boolean {
    if (this.groupsById.has(group.id)) return false;
    if (this.size >= this._capacity) return false;
    this.groupsById.set(group.id, group);
    return true;
  }

  /** Removes `id`. Returns whether a group was removed. */
  remove(id: string): boolean {
    return this.groupsById.delete(id);
  }
}
