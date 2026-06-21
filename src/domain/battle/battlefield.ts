/**
 * Pure positional primitives for the 1D battlefield (M10).
 *
 * Axis: `x` increases to the right. The **party** advances toward −x (left);
 * **enemies** advance toward +x (right). They converge. A side's *front-most*
 * unit is the one furthest along its advance direction (party = min x, enemy =
 * max x). No state lives here — `Battle` composes these helpers each tick.
 */

import { MOVE_SPEED } from "./tuning";

/** Which team a combatant fights for. */
export type Side = "party" | "enemy";

/** The sign of a side's advance along the x-axis: party −1 (left), enemy +1 (right). */
export function advanceDirection(side: Side): -1 | 1 {
  return side === "party" ? -1 : 1;
}

/** Absolute distance between two positions on the line. */
export function distance(a: number, b: number): number {
  return Math.abs(a - b);
}

/** Movement step (units) covered in `deltaMs` at the shared `MOVE_SPEED`. */
export function stepFor(deltaMs: number): number {
  return (MOVE_SPEED * deltaMs) / 1000;
}

/**
 * The front-most unit of `side` among `units` — the one furthest toward the
 * enemy (party = smallest x, enemy = largest x). Returns `undefined` if empty.
 * Caller passes only the units that should be considered (e.g. the living ones).
 */
export function frontMost<T extends { readonly x: number }>(
  units: readonly T[],
  side: Side,
): T | undefined {
  if (units.length === 0) return undefined;
  const wantSmallest = side === "party";
  return units.reduce((front, u) =>
    wantSmallest ? (u.x < front.x ? u : front) : u.x > front.x ? u : front,
  );
}

/**
 * Move `x` toward `targetX` by up to `step`, but stop `range` short of the
 * target (so the unit ends in attack range, never on top of / past it).
 *
 * If already within `range`, `x` is unchanged. Never overshoots the stop point.
 */
export function approach(
  x: number,
  targetX: number,
  step: number,
  range: number,
): number {
  if (distance(x, targetX) <= range) return x;
  const dir = targetX > x ? 1 : -1;
  const stopAt = targetX - dir * range; // `range` short of the target
  return dir === 1 ? Math.min(x + step, stopAt) : Math.max(x - step, stopAt);
}
