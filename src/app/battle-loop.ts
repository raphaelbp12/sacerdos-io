/**
 * Auto-loop policy (M23): given the stage just fought, the player's frontier (the
 * highest stage they've reached this run), and the {@link StageReport}, decide what to
 * fight next so the battle loop runs **hands-free**.
 *
 * This is the single source of the "what next?" decision (OCP — the loop just executes
 * the returned plan; no rules live in React). It is pure and unit-tested without a DOM.
 *
 * Rules (from the overview's gameplay loop):
 *   - **clear on the frontier stage** → advance one stage (the frontier moves with you),
 *   - **clear on an earlier-selected stage** → repeat it (you're farming; don't advance),
 *   - **wipe with "retry on wipe"** → re-fight the same stage,
 *   - **wipe without retry** → retreat one stage (never below the first stage).
 */

import type { StageReport } from "./game-session";
import type { StagePosition } from "../domain/stages";
import { advance, retreat } from "../domain/stages";

export type StagePlanAction = "advance" | "repeat" | "retreat";

export interface StagePlan {
  /** What the loop should do next. */
  readonly action: StagePlanAction;
  /** The stage to select for the next run. */
  readonly next: StagePosition;
  /** The updated frontier (high-water mark) after this outcome. */
  readonly frontier: StagePosition;
}

export interface NextStageOptions {
  /** When true, a wipe re-fights the same stage instead of retreating. */
  readonly retryOnWipe?: boolean;
}

/** Order positions: by act, then stage. `>0` when `a` is later than `b`. */
function comparePositions(a: StagePosition, b: StagePosition): number {
  return a.actIndex - b.actIndex || a.stageIndex - b.stageIndex;
}

function maxPosition(a: StagePosition, b: StagePosition): StagePosition {
  return comparePositions(a, b) >= 0 ? a : b;
}

export function nextStagePlan(
  fought: StagePosition,
  frontier: StagePosition,
  report: StageReport,
  options: NextStageOptions = {},
): StagePlan {
  if (report.status === "cleared") {
    const atFrontier = comparePositions(fought, frontier) >= 0;
    if (atFrontier) {
      const next = advance(fought);
      return { action: "advance", next, frontier: maxPosition(frontier, next) };
    }
    // Farming an earlier stage: stay put.
    return { action: "repeat", next: fought, frontier };
  }

  // Wiped.
  if (options.retryOnWipe) {
    return { action: "repeat", next: fought, frontier };
  }
  return { action: "retreat", next: retreat(fought), frontier };
}
