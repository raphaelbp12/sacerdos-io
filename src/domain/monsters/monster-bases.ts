import type { MonsterDef } from "./monster-def";

/**
 * The monster archetype database (first roster — D-009).
 *
 * Rules for contributors:
 * - One row per archetype. Stats scale by level via `scaleMonster`, not here.
 * - `id` must be unique across the whole array.
 * - A new monster is a data row — no engine code changes needed.
 *
 * `preferredElement` only takes effect when the act allows that element
 * (`scaleMonster(..., allowedElements)`); otherwise the monster deals physical.
 */
export const MONSTER_BASES: readonly MonsterDef[] = [
  // ── Normal — weak ─────────────────────────────────────────────────────────
  {
    id: "goblin-grunt",
    name: "Goblin Grunt",
    baseStats: { hp: 30, attack: 5, armor: 2, flatDamage: 3 },
    perLevelGains: { hp: 8, attack: 1, armor: 1, flatDamage: 1 },
    preferredElement: "physical",
  },
  // ── Normal — strong ───────────────────────────────────────────────────────
  {
    id: "orc-brute",
    name: "Orc Brute",
    baseStats: { hp: 60, attack: 9, armor: 5, flatDamage: 6 },
    perLevelGains: { hp: 14, attack: 2, armor: 2, flatDamage: 2 },
    preferredElement: "physical",
  },
  // ── Boss archetype (a normal monster; scaleBoss raises its stats) ─────────
  {
    id: "ogre-warlord",
    name: "Ogre Warlord",
    baseStats: { hp: 120, attack: 14, armor: 8, flatDamage: 10 },
    perLevelGains: { hp: 20, attack: 3, armor: 3, flatDamage: 3 },
    // Fire-flavoured: deals physical in act 1, fire once act 2 allows it.
    preferredElement: "fire",
  },
];

/** Look up a monster archetype by id. Throws if the id is unknown. */
export function monsterById(id: string): MonsterDef {
  const def = MONSTER_BASES.find((m) => m.id === id);
  if (!def) throw new Error(`unknown monster: ${id}`);
  return def;
}
