/**
 * The wave / stage runner (M10): drives a **persistent** party through an
 * ordered list of monster waves, ending with the stage boss (the final wave).
 *
 * A "wave" is just an array of `Monster`s — the boss is the last single-monster
 * wave. The runner deliberately does **not** define a stage / act schema; M11's
 * `stage-def.ts` will *produce* these waves from data (DRY). Party HP persists
 * across waves within a stage; mid-stage revive / respawn timers are M12.
 *
 * Deterministic under the injected `Rng`: the same party + waves + seed always
 * yields the same outcome and the same number of monsters (fixed reward).
 */

import type { Clock } from "../clock";
import type { Rng } from "../rng";
import type { Monster } from "../monsters";
import { Battle } from "./battle";
import { BattleUnit } from "./battle-unit";
import { ENEMY_SPAWN_X, PARTY_START_X, UNIT_SPACING } from "./tuning";

export type StageStatus = "ongoing" | "cleared" | "wiped";

export class StageRunner implements Clock {
  readonly party: readonly BattleUnit[];
  private readonly waves: readonly (readonly Monster[])[];
  private readonly rng: Rng;
  private _waveIndex = 0;
  private _battle: Battle;
  private _status: StageStatus = "ongoing";

  constructor(
    party: readonly BattleUnit[],
    waves: readonly (readonly Monster[])[],
    rng: Rng,
  ) {
    if (waves.length === 0) {
      throw new Error("a stage needs at least one wave");
    }
    this.party = party;
    this.waves = waves;
    this.rng = rng;
    this._battle = this.spawnWave(0);
  }

  get status(): StageStatus {
    return this._status;
  }

  /** Index of the wave currently being fought (0-based). */
  get currentWaveIndex(): number {
    return this._waveIndex;
  }

  get waveCount(): number {
    return this.waves.length;
  }

  /** Total monsters across all waves — the stage's fixed reward count. */
  get totalMonsters(): number {
    return this.waves.reduce((sum, w) => sum + w.length, 0);
  }

  /** The encounter currently in progress (for the UI / inspection). */
  get currentBattle(): Battle {
    return this._battle;
  }

  /** Reposition the party and spawn wave `index`'s monsters into a fresh `Battle`. */
  private spawnWave(index: number): Battle {
    this.party.forEach((unit, i) => {
      unit.x = PARTY_START_X + i * UNIT_SPACING;
      unit.attackTimerMs = unit.basicAttackInterval();
    });
    const enemies = this.waves[index].map(
      (monster, i) =>
        new BattleUnit(
          monster,
          "enemy",
          ENEMY_SPAWN_X - i * UNIT_SPACING,
          [],
          monster.element,
        ),
    );
    return new Battle(this.party, enemies, this.rng);
  }

  advance(deltaMs: number): void {
    this.tick(deltaMs);
  }

  tick(deltaMs: number): void {
    if (this._status !== "ongoing") return;

    this._battle.tick(deltaMs);
    const result = this._battle.status;

    if (result === "lost") {
      this._status = "wiped";
      return;
    }
    if (result === "won") {
      if (this._waveIndex >= this.waves.length - 1) {
        this._status = "cleared"; // the boss (last wave) is down
        return;
      }
      this._waveIndex += 1;
      this._battle = this.spawnWave(this._waveIndex);
    }
  }
}
