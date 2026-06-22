/**
 * Offline / idle progress (M21) — fast-forward farming on the current stage.
 *
 * `simulateElapsed` reuses the **real** M10 battle tick (no parallel simulation,
 * DRY): it replays the active group through the current stage's waves under an
 * injected `Rng`, batching cleared stages into gold + xp + chest rolls. It is
 * **pure** — it reads `state` but never mutates it; the shell applies the
 * returned {@link OfflineReport}.
 *
 * Outer layer: `offline → persistence → domain`. Randomness is injected, so the
 * same elapsed time + seed always yields the same report.
 */

import type { GameState } from "../persistence";
import { buildRoster, buildGroupRoster } from "../persistence";

import type { Rng } from "../domain/rng";
import type { Item } from "../domain/items";
import { StageRunner } from "../domain/battle";
import { goldForKill } from "../domain/economy";
import type { GoldSource } from "../domain/economy";
import { rollDrop, COMMON_CHEST_TABLE } from "../domain/loot";
import {
  actByIndex,
  stageAt,
  buildStageWaves,
  stageItemLevel,
  stageMonsterLevel,
  xpForKill,
} from "../domain/stages";

/** Default offline ceiling: at most 8 h of real time is rewarded per return. */
export const DEFAULT_OFFLINE_CEILING_MS = 8 * 60 * 60 * 1000;

/** Fixed battle step used to fast-forward the stage runner (coarser = faster, less exact). */
export const OFFLINE_TICK_STEP_MS = 100;

export interface OfflineOptions {
  /** Maximum elapsed time rewarded (default {@link DEFAULT_OFFLINE_CEILING_MS}). */
  readonly ceilingMs?: number;
  /** Battle tick granularity (default {@link OFFLINE_TICK_STEP_MS}). */
  readonly tickStepMs?: number;
}

/** What an offline run earned. Pure data — the shell applies it to the live state. */
export interface OfflineReport {
  /** Elapsed time actually simulated (input clamped to `[0, ceilingMs]`). */
  readonly elapsedMs: number;
  /** Number of full stage clears completed. */
  readonly stagesCleared: number;
  /** Total gold earned across all clears. */
  readonly gold: number;
  /** Total (pooled) xp earned — reported only; no per-character home yet (D-037). */
  readonly xp: number;
  /** Chest items that fit in the inventory's free slots. */
  readonly items: readonly Item[];
  /** Items rolled but lost because the inventory was full. */
  readonly itemsLost: number;
}

const EMPTY = (elapsedMs: number): OfflineReport => ({
  elapsedMs,
  stagesCleared: 0,
  gold: 0,
  xp: 0,
  items: [],
  itemsLost: 0,
});

/** Free inventory slots, or `Infinity` when the inventory is unlimited. */
function freeSlots(state: GameState): number {
  const cap = state.inventory.capacity;
  return cap === Infinity
    ? Infinity
    : Math.max(0, cap - state.inventory.slotsUsed);
}

/**
 * Fast-forward farming on the current stage for `deltaMs` of real time. Pure:
 * returns the rewards; does not touch `state`.
 */
export function simulateElapsed(
  state: GameState,
  deltaMs: number,
  rng: Rng,
  options: OfflineOptions = {},
): OfflineReport {
  const ceiling = options.ceilingMs ?? DEFAULT_OFFLINE_CEILING_MS;
  const step = options.tickStepMs ?? OFFLINE_TICK_STEP_MS;
  const elapsed = Math.min(Math.max(0, deltaMs), ceiling);
  if (elapsed <= 0) return EMPTY(0);

  // The active group is the first owned group; bail if there's nothing to field.
  const group = buildGroupRoster(state).groups[0];
  if (!group || group.size === 0) return EMPTY(elapsed);

  const { actIndex, stageIndex } = state.progression.position;
  const difficulty = state.progression.difficulty;
  const act = actByIndex(actIndex);
  const stage = stageAt(actIndex, stageIndex);

  const level = stageMonsterLevel(stage, difficulty);
  const itemLevel = stageItemLevel(stage, difficulty);
  const monsterSource: GoldSource =
    stage.index <= 5 ? "weakMonster" : "strongMonster";
  const monsterGold = goldForKill(
    monsterSource,
    level,
    state.runes.goldModifiersFor("monster"),
  );
  const bossGold = goldForKill(
    "stageBoss",
    level,
    state.runes.goldModifiersFor("boss"),
  );
  const monsterXp = xpForKill("monster", stage.xpPerMonster);
  const bossXp = xpForKill("stageBoss", stage.xpPerMonster);

  const slots = freeSlots(state);

  let remaining = elapsed;
  let stagesCleared = 0;
  let gold = 0;
  let xp = 0;
  const items: Item[] = [];
  let itemsLost = 0;

  while (remaining > 0) {
    // Fresh, full-HP party each stage (revive-all at stage start — reuses M20 rehydration).
    const party = group.buildParty(buildRoster(state));
    if (party.length === 0) break;

    const runner = new StageRunner(
      party,
      buildStageWaves(act, stage, difficulty),
      rng,
    );
    while (runner.status === "ongoing" && remaining > 0) {
      const dt = Math.min(step, remaining);
      runner.tick(dt);
      remaining -= dt;
    }

    // Only a fully-cleared stage pays out; a wipe or a timed-out partial stage ends the run.
    if (runner.status !== "cleared") break;

    const regularMonsters = runner.totalMonsters - 1; // last "monster" is the stage boss
    stagesCleared += 1;
    gold += regularMonsters * monsterGold + bossGold;
    xp += regularMonsters * monsterXp + bossXp;

    // One chest item per cleared stage; the roll always advances the rng (determinism),
    // but the item is only kept while inventory slots remain.
    const drop = rollDrop(COMMON_CHEST_TABLE, rng, itemLevel);
    if (items.length < slots) items.push(drop);
    else itemsLost += 1;
  }

  return { elapsedMs: elapsed, stagesCleared, gold, xp, items, itemsLost };
}
