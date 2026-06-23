import { useEffect, useRef } from "react";
import type { Clock } from "../../domain/clock";

/**
 * The single `requestAnimationFrame` loop that drives a {@link Clock} in real time —
 * the **only** place wall-clock time enters the app (the domain stays time-injected).
 *
 * Real frame deltas are accumulated and drained into **fixed** `stepMs` chunks so the
 * underlying battle advances deterministically regardless of frame rate (and so a
 * stutter doesn't change outcomes). The draining math lives in {@link drainSteps}, a
 * pure helper that is unit-tested without a DOM.
 */

/** Default fixed battle step, matching the domain's run-to-completion granularity. */
export const DEFAULT_STEP_MS = 100;
/** Cap on fixed steps drained per frame, so a long pause can't freeze the UI catching up. */
export const MAX_STEPS_PER_FRAME = 300;

/** How many whole `stepMs` chunks `accumulatedMs` contains, plus the leftover. Pure. */
export function drainSteps(
  accumulatedMs: number,
  stepMs: number,
  maxSteps = MAX_STEPS_PER_FRAME,
): { steps: number; remainder: number } {
  if (stepMs <= 0 || accumulatedMs <= 0) {
    return { steps: 0, remainder: Math.max(0, accumulatedMs) };
  }
  const whole = Math.floor(accumulatedMs / stepMs);
  const steps = Math.min(whole, maxSteps);
  return { steps, remainder: accumulatedMs - steps * stepMs };
}

export interface UseClockLoopOptions {
  /** The clock to advance (e.g. a {@link import("../../app").BattleSession}). */
  readonly clock: Clock;
  /** When false, the loop is idle (paused); flipping to true resumes it. */
  readonly playing: boolean;
  /** Fixed advance granularity in ms (default {@link DEFAULT_STEP_MS}). */
  readonly stepMs?: number;
  /** Called once per frame that advanced the clock (the shell re-renders here). */
  readonly onTick?: () => void;
}

export function useClockLoop({
  clock,
  playing,
  stepMs = DEFAULT_STEP_MS,
  onTick,
}: UseClockLoopOptions): void {
  const accRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastRef.current = null;
      accRef.current = 0;
      return;
    }

    let raf = 0;
    const frame = (now: number) => {
      const last = lastRef.current ?? now;
      lastRef.current = now;
      accRef.current += now - last;

      const { steps, remainder } = drainSteps(accRef.current, stepMs);
      accRef.current = remainder;
      for (let i = 0; i < steps; i++) clock.advance(stepMs);
      if (steps > 0) onTick?.();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [clock, playing, stepMs, onTick]);
}
