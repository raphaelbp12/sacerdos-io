/**
 * Abstraction for advancing time in abstract units.
 * - Turn-based: caller advances by 1 per turn.
 * - Real-time: caller advances by deltaSeconds per frame.
 * - Tests: caller advances manually for deterministic results.
 *
 * Domain code never reads wall-clock time directly.
 */
export interface Clock {
  advance(amount: number): void;
}
