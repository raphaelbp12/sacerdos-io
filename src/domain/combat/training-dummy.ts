/**
 * A minimal practice target implementing the `Combatant` contract (M6).
 *
 * Not the enemy/monster system (deferred — D-009). Just enough to attack:
 * a name, a pool of HP, and configurable defensive stats (default: none).
 */

import type { Stat } from "../stats";
import { defaultStat } from "../stats";
import type { Combatant } from "./combatant";

export class TrainingDummy implements Combatant {
  readonly name: string;
  private readonly stats: Readonly<Partial<Record<Stat, number>>>;
  private _currentHP: number;

  constructor(
    name = "Training Dummy",
    stats: Readonly<Partial<Record<Stat, number>>> = { hp: 1000 },
  ) {
    this.name = name;
    this.stats = stats;
    this._currentHP = this.getStat("hp");
  }

  getStat(stat: Stat): number {
    return this.stats[stat] ?? defaultStat(stat);
  }

  get currentHP(): number {
    return this._currentHP;
  }

  takeDamage(amount: number): void {
    this._currentHP = Math.max(0, this._currentHP - amount);
  }

  /** Restore the dummy to full HP. */
  reset(): void {
    this._currentHP = this.getStat("hp");
  }
}
