/**
 * Item-level **threshold bands** for the cube (M17).
 *
 * The player picks a band before recycling; synthesis only accepts inputs whose item level falls
 * inside it (the overview: an item above _or_ below the selected threshold is blocked). Bands are
 * DATA — adding a tier never edits the engine.
 *
 * Bands come straight from the overview §"Cube system": 1–10, 10–15, 15–30, 30–40, 50–60.
 * Bounds are inclusive on both ends; overlapping endpoints (e.g. level 10) are intentionally
 * reachable from either adjacent band, matching the overview's listing.
 */
export interface Threshold {
  readonly min: number;
  readonly max: number;
}

export const THRESHOLDS: readonly Threshold[] = [
  { min: 1, max: 10 },
  { min: 10, max: 15 },
  { min: 15, max: 30 },
  { min: 30, max: 40 },
  { min: 50, max: 60 },
];

/** True when `level` falls inside the band `t` (inclusive on both ends). */
export function withinThreshold(level: number, t: Threshold): boolean {
  return level >= t.min && level <= t.max;
}
