/**
 * Battle tuning constants (M10) — all in one documented place, like `derived.ts`.
 *
 * Distances are abstract units on the 1D battlefield line; speeds are units/sec.
 * Several of these are placeholders pending live tuning:
 *   - movement speed is a single shared constant (per-unit speed deferred → D-022),
 *   - skill ranges are coarse placeholders (concrete ranges deferred → D-015).
 */

import type { SkillRange } from "../skills";

/** Shared movement speed for every unit, in units per second (D-022). */
export const MOVE_SPEED = 100;

/** Basic (melee) attack range — also a unit's default engagement / stop distance. */
export const BASIC_ATTACK_RANGE = 10;

/** Placeholder distances per coarse `SkillRange` tag (D-015 — "tune live"). */
export const SKILL_RANGE: Readonly<Record<SkillRange, number>> = {
  self: 0,
  short: 10,
  area: 30,
  long: 100,
};

/** Where the party's front unit starts (right side), and per-unit back-spacing. */
export const PARTY_START_X = 300;
/** Where the enemy's front spawns (left, "outside the view") and back-spacing. */
export const ENEMY_SPAWN_X = -100;
/** Gap between consecutive units of the same side at spawn (back ranks). */
export const UNIT_SPACING = 20;
/** Left wall of the stage; the party never advances past it. */
export const STAGE_LEFT_LIMIT = 0;
