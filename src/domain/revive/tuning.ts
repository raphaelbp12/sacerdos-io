/**
 * Death & revive tuning (M12) — all constants in one place.
 *
 * The respawn wait is real-time (the overview's "2-minute" timer); the `Clock`
 * unit is milliseconds, like cooldowns and the battle tick.
 */

/** Base respawn wait for a downed member: 2 minutes. */
export const BASE_RESPAWN_MS = 120_000;

/** A respawn can never resolve to a negative wait. */
export const MIN_RESPAWN_MS = 0;

/** Placeholder paid instant-revive cost (D-017 — pricing not balanced yet). */
export const INSTANT_REVIVE_BASE_COST = 50;
export const INSTANT_REVIVE_COST_PER_LEVEL = 10;
