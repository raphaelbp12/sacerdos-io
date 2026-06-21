/**
 * Latest-stage progression rules (M11).
 *
 * The player farms whichever stage is selected. On the **latest** stage,
 * clearing it advances one stage; wiping retreats one stage (never below the
 * first stage of the first act). Acts chain: clearing act N stage 9 advances to
 * act N+1 stage 1; retreating from act N stage 1 drops to act N-1 stage 9.
 *
 * Pure functions over a 1-based `StagePosition`; the acts list defines the
 * bounds so adding acts/stages needs no change here.
 */

import { ACTS } from "./act-def";
import type { Difficulty } from "./difficulty";

export interface StagePosition {
  /** 1-based act index. */
  readonly actIndex: number;
  /** 1-based stage index within the act. */
  readonly stageIndex: number;
}

const FIRST: StagePosition = { actIndex: 1, stageIndex: 1 };

function stagesIn(actIndex: number): number {
  const act = ACTS.find((a) => a.index === actIndex);
  return act ? act.stages.length : 0;
}

function lastActIndex(): number {
  return ACTS.reduce((max, a) => Math.max(max, a.index), 1);
}

/** Whether `pos` is the final stage of the final act. */
export function isFinalStage(pos: StagePosition): boolean {
  return (
    pos.actIndex === lastActIndex() && pos.stageIndex === stagesIn(pos.actIndex)
  );
}

/** Advance after clearing the latest stage. Capped at the final stage. */
export function advance(pos: StagePosition): StagePosition {
  if (isFinalStage(pos)) return pos;
  if (pos.stageIndex < stagesIn(pos.actIndex)) {
    return { actIndex: pos.actIndex, stageIndex: pos.stageIndex + 1 };
  }
  return { actIndex: pos.actIndex + 1, stageIndex: 1 };
}

/** Retreat after a wipe. Never drops below the first stage of the first act. */
export function retreat(pos: StagePosition): StagePosition {
  if (pos.stageIndex > 1) {
    return { actIndex: pos.actIndex, stageIndex: pos.stageIndex - 1 };
  }
  if (pos.actIndex > 1) {
    const prev = pos.actIndex - 1;
    return { actIndex: prev, stageIndex: stagesIn(prev) };
  }
  return FIRST;
}

/**
 * Whether a difficulty is playable. `normal` is always unlocked; `hard` unlocks
 * once the normal final act boss has been defeated.
 */
export function isDifficultyUnlocked(
  difficulty: Difficulty,
  clearedNormalFinalActBoss: boolean,
): boolean {
  return difficulty === "normal" || clearedNormalFinalActBoss;
}
