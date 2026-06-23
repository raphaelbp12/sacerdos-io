/**
 * Battle event sink (M24): an **observer** seam the engine emits per-hit / per-skill /
 * per-death facts into, so the UI can surface floating damage numbers and a combat feed
 * **without** the domain ever knowing the UI exists (DIP + Open/Closed).
 *
 * The sink is **injected** and defaults to {@link NO_OP_EVENTS}, so a battle run with no
 * observer behaves byte-for-byte as before — events are *emitted*, never *read*, inside
 * the domain, so determinism under a fixed seed is unchanged. Adding new observed facts
 * later (e.g. M30 skill visuals) only adds emit calls; no consumer is forced to change.
 */

import type { DamageElement } from "../combat";
import type { Side } from "./battlefield";

/** A landed (or avoided) basic-attack hit. `damage` is 0 when blocked/dodged. */
export interface HitEvent {
  readonly attacker: string;
  readonly target: string;
  readonly targetSide: Side;
  /** The target's position on the 1D line when the hit resolved. */
  readonly x: number;
  readonly damage: number;
  readonly blocked: boolean;
  readonly dodged: boolean;
  /** Whether this hit dropped the target to 0 HP. */
  readonly defeated: boolean;
  readonly element: DamageElement;
}

/** A skill the caster fired this tick (consumed by M30's skill visuals). */
export interface SkillEvent {
  readonly caster: string;
  readonly casterSide: Side;
  readonly skillId: string;
  readonly rank: number;
  /** The caster's position on the 1D line. */
  readonly x: number;
}

/** A unit reaching 0 HP. */
export interface DeathEvent {
  readonly unit: string;
  readonly side: Side;
  readonly x: number;
}

export interface BattleEvents {
  onHit(event: HitEvent): void;
  onSkill(event: SkillEvent): void;
  onDeath(event: DeathEvent): void;
}

/** A tagged union of every battle event, for buffering and UI consumption. */
export type BattleEvent =
  | ({ type: "hit" } & HitEvent)
  | ({ type: "skill" } & SkillEvent)
  | ({ type: "death" } & DeathEvent);

/** Shared do-nothing sink — the default, so an unobserved battle is unchanged. */
export const NO_OP_EVENTS: BattleEvents = {
  onHit() {},
  onSkill() {},
  onDeath() {},
};

/**
 * A buffering sink that records every event in order. The shell drains it once per frame
 * to drive floating numbers and the combat feed; tests use it to assert what the engine
 * emitted. Holds no game logic.
 */
export class RecordingEvents implements BattleEvents {
  private buffer: BattleEvent[] = [];

  onHit(event: HitEvent): void {
    this.buffer.push({ type: "hit", ...event });
  }

  onSkill(event: SkillEvent): void {
    this.buffer.push({ type: "skill", ...event });
  }

  onDeath(event: DeathEvent): void {
    this.buffer.push({ type: "death", ...event });
  }

  /** A read-only view of everything recorded so far (no clear). */
  get events(): readonly BattleEvent[] {
    return this.buffer;
  }

  /** Return everything buffered and reset, so each drain yields only new events. */
  drain(): readonly BattleEvent[] {
    const out = this.buffer;
    this.buffer = [];
    return out;
  }
}
