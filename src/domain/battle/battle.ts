/**
 * The single-encounter battle engine (M10): a party vs a fixed list of enemies
 * on the 1D battlefield, advanced by a `Clock`-style `tick(deltaMs)`.
 *
 * The tick order is **locked** (for deterministic replays under a fixed seed):
 *   1. advance every unit's skill cooldowns,
 *   2. move each living unit toward its target (party first, then enemies),
 *   3. act — skills first, then basic attacks — paced by attack speed via `Rng`,
 *   4. recompute `status`.
 *
 * Pure except for the injected `Rng` and the mutation of combatant HP / unit
 * positions. No `Math.random()`, no wall-clock reads. Front-to-back targeting:
 * every unit focuses the opposing front-most living unit.
 */

import { resolveAttack } from "../combat";
import { resolveSkillDamage } from "../skills";
import type { Clock } from "../clock";
import type { Rng } from "../rng";
import type { BattleUnit } from "./battle-unit";
import { approach, distance, frontMost, stepFor } from "./battlefield";
import { SKILL_RANGE, STAGE_LEFT_LIMIT } from "./tuning";
import type { BattleEvents } from "./events";
import { NO_OP_EVENTS } from "./events";

export type BattleStatus = "ongoing" | "won" | "lost";

export class Battle implements Clock {
  readonly party: readonly BattleUnit[];
  readonly enemies: readonly BattleUnit[];
  private readonly rng: Rng;
  private readonly events: BattleEvents;

  constructor(
    party: readonly BattleUnit[],
    enemies: readonly BattleUnit[],
    rng: Rng,
    events: BattleEvents = NO_OP_EVENTS,
  ) {
    this.party = party;
    this.enemies = enemies;
    this.rng = rng;
    this.events = events;
  }

  /** `won` when all enemies are down, `lost` when the party is, else `ongoing`. */
  get status(): BattleStatus {
    if (!this.enemies.some((u) => u.isAlive)) return "won";
    if (!this.party.some((u) => u.isAlive)) return "lost";
    return "ongoing";
  }

  /** Living units on the opposing side of `unit`. */
  private opponentsOf(unit: BattleUnit): BattleUnit[] {
    const foes = unit.side === "party" ? this.enemies : this.party;
    return foes.filter((u) => u.isAlive);
  }

  /** The opposing front-most living unit `unit` should focus, if any. */
  private targetFor(unit: BattleUnit): BattleUnit | undefined {
    const foes = this.opponentsOf(unit);
    const foeSide = unit.side === "party" ? "enemy" : "party";
    return frontMost(foes, foeSide);
  }

  advance(deltaMs: number): void {
    this.tick(deltaMs);
  }

  tick(deltaMs: number): void {
    if (this.status !== "ongoing") return;

    // 1. Cooldowns tick for everyone (even while approaching).
    for (const u of [...this.party, ...this.enemies]) {
      if (u.isAlive) u.cooldowns.advance(deltaMs);
    }

    // 2. Movement — party first, then enemies, each toward its current target.
    const step = stepFor(deltaMs);
    this.moveSide(this.party, step);
    this.moveSide(this.enemies, step);

    // 3. Actions — locked order: party then enemies; skills before basics.
    for (const unit of [...this.party, ...this.enemies]) {
      if (unit.isAlive) this.act(unit, deltaMs);
    }
  }

  private moveSide(units: readonly BattleUnit[], step: number): void {
    for (const unit of units) {
      if (!unit.isAlive) continue;
      const target = this.targetFor(unit);
      if (!target) continue;
      let next = approach(unit.x, target.x, step, unit.engageRange);
      if (unit.side === "party") next = Math.max(next, STAGE_LEFT_LIMIT);
      unit.x = next;
    }
  }

  private act(unit: BattleUnit, deltaMs: number): void {
    const target = this.targetFor(unit);
    if (!target) return;

    this.castSkills(unit, target);
    this.basicAttack(unit, target, deltaMs);
  }

  private castSkills(unit: BattleUnit, target: BattleUnit): void {
    for (const { def, rank } of unit.skills) {
      // Only damage skills auto-cast in M10; buff/debuff in-battle is deferred (D-023).
      if (def.kind !== "damage" && def.kind !== "areaDamage") continue;
      if (!unit.cooldowns.isReady(def.id)) continue;
      if (distance(unit.x, target.x) > SKILL_RANGE[def.range]) continue;

      const cdr = unit.combatant.getStat("cooldownReduction");
      unit.cooldowns.use(def.id, def.cooldownMs, cdr);

      if (def.kind === "areaDamage") {
        // Fan out to every living foe within the skill's radius of the caster.
        const radius = SKILL_RANGE[def.range];
        for (const foe of this.opponentsOf(unit)) {
          if (distance(unit.x, foe.x) <= radius) {
            resolveSkillDamage(def, rank, unit.combatant, foe.combatant);
          }
        }
      } else {
        resolveSkillDamage(def, rank, unit.combatant, target.combatant);
      }
    }
  }

  private basicAttack(
    unit: BattleUnit,
    target: BattleUnit,
    deltaMs: number,
  ): void {
    if (distance(unit.x, target.x) > unit.engageRange) return; // out of range: wind-up paused
    unit.attackTimerMs -= deltaMs;
    while (unit.attackTimerMs <= 0 && target.isAlive) {
      const result = resolveAttack(
        unit.combatant,
        target.combatant,
        this.rng,
        unit.attackElement,
      );
      this.events.onHit({
        attacker: unit.name,
        target: target.name,
        targetSide: target.side,
        x: target.x,
        damage: result.damage,
        blocked: result.blocked,
        dodged: result.dodged,
        defeated: result.defeated,
        element: result.element,
      });
      if (result.defeated) {
        this.events.onDeath({
          unit: target.name,
          side: target.side,
          x: target.x,
        });
      }
      unit.attackTimerMs += unit.basicAttackInterval();
    }
    if (unit.attackTimerMs < 0) unit.attackTimerMs = 0; // target died mid-wind-up
  }
}
