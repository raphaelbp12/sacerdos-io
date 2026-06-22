/**
 * The character **roster** (M19): the collection of characters the player owns.
 *
 * Holds a capacity (the account's *hero slots* — default {@link DEFAULT_HERO_SLOTS},
 * grown by the rune tree, M18) and the owned {@link RosterMember}s keyed by a stable
 * `id`. Pure and stateful only in the membership map — a member's stats / HP live on
 * its `Combatant` (compute-don't-store). One-way deps: `roster → combat`; the rune
 * capacity is injected as a plain number so this module never imports `runes`.
 */

import type { Combatant, DamageElement } from "../combat";
import type { SkillLoadoutEntry } from "../battle";

/** Default number of characters the player may own (overview: 3, expandable). */
export const DEFAULT_HERO_SLOTS = 3;

/**
 * An owned character — the minimal bundle needed to field a unit on the battlefield.
 * `id` is the stable account identity; the rest are exactly the inputs a `BattleUnit`
 * consumes (so a `Group` can turn a member into a unit without extra plumbing).
 */
export interface RosterMember {
  /** Stable identity within the roster. */
  readonly id: string;
  /** The character's live combatant (final stats + HP read on demand). */
  readonly combatant: Combatant;
  /** Damage skills the character may auto-cast (default: none). */
  readonly skills?: readonly SkillLoadoutEntry[];
  /** Element of the character's basic attacks (default: physical). */
  readonly attackElement?: DamageElement;
}

/** The player's owned characters, capped by hero slots. */
export class Roster {
  private readonly membersById = new Map<string, RosterMember>();
  declare private readonly _capacity: number;

  constructor(capacity: number = DEFAULT_HERO_SLOTS) {
    this._capacity = capacity;
  }

  /** Maximum number of characters the player may own. */
  get capacity(): number {
    return this._capacity;
  }

  /** Number of characters currently owned. */
  get size(): number {
    return this.membersById.size;
  }

  /** Owned characters in insertion order. */
  get members(): readonly RosterMember[] {
    return [...this.membersById.values()];
  }

  /** Whether `id` is owned. */
  has(id: string): boolean {
    return this.membersById.has(id);
  }

  /** The owned member for `id`, or `undefined`. */
  get(id: string): RosterMember | undefined {
    return this.membersById.get(id);
  }

  /**
   * Adds `member`. Returns `false` (no mutation) when the roster is full or the id
   * is already owned; `true` on success.
   */
  add(member: RosterMember): boolean {
    if (this.membersById.has(member.id)) return false;
    if (this.size >= this._capacity) return false;
    this.membersById.set(member.id, member);
    return true;
  }

  /** Removes `id`. Returns whether a member was removed. */
  remove(id: string): boolean {
    return this.membersById.delete(id);
  }
}
