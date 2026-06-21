/**
 * Stage / act-boss data shapes (M11).
 *
 * A `StageDef` is the fixed content of one stage: its regular waves (sizes),
 * which monster archetype fills them, the stage-boss archetype, and the base
 * monster/item level + per-monster rewards. Difficulty adds flat level bonuses
 * on top (see `build-waves.ts`); the *shape* of a stage never changes.
 *
 * The boss is the last wave of every stage; the **act boss** (`ActBossDef`) is a
 * separate, key-gated single-boss encounter.
 */

export interface StageDef {
  /** 1-based index of the stage within its act (1..9). */
  readonly index: number;
  readonly name: string;
  /**
   * Monsters per regular (non-boss) wave. The stage-boss wave is appended by
   * `buildStageWaves`, so a stage's total monster count is
   * `sum(waveSizes) + 1` — fixed, so the same stage always yields the same
   * reward.
   */
  readonly waveSizes: readonly number[];
  /** Archetype id that fills the regular waves. */
  readonly monsterId: string;
  /** Archetype id scaled (×boss multiplier) for the stage-boss wave. */
  readonly bossId: string;
  /** Base monster level (difficulty adds its bonus). */
  readonly monsterLevel: number;
  /** Base item level of this stage's loot (difficulty adds its bonus). */
  readonly itemLevel: number;
  readonly goldPerMonster: number;
  readonly xpPerMonster: number;
}

export interface ActBossDef {
  readonly name: string;
  /** Archetype id scaled (×boss multiplier) for the act-boss fight. */
  readonly bossId: string;
  readonly monsterLevel: number;
  readonly itemLevel: number;
  readonly goldReward: number;
  readonly xpReward: number;
}
