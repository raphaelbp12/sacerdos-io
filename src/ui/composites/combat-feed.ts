import type { BattleEvent } from "../../domain/battle";
import type { Floater } from "./BattleStrip";

/**
 * Pure translation of drained {@link BattleEvent}s into UI artifacts (M24): rising
 * {@link Floater} numbers over the battlefield and human-readable combat-feed lines.
 *
 * Kept pure and id-threaded (no React, no clock) so it's unit-testable and the screen
 * just accumulates the results into bounded state each frame.
 */
export interface IngestResult {
  readonly floaters: readonly Floater[];
  readonly lines: readonly string[];
  /** The next free floater id, threaded so keys stay unique across frames. */
  readonly nextId: number;
}

export function ingestBattleEvents(
  events: readonly BattleEvent[],
  startId: number,
): IngestResult {
  let id = startId;
  const floaters: Floater[] = [];
  const lines: string[] = [];

  for (const e of events) {
    switch (e.type) {
      case "hit":
        if (e.dodged) {
          floaters.push({ id: id++, x: e.x, text: "DODGE", tone: "dodge" });
          lines.push(`${e.target} dodges ${e.attacker}`);
        } else if (e.blocked) {
          floaters.push({ id: id++, x: e.x, text: "BLOCK", tone: "block" });
          lines.push(`${e.target} blocks ${e.attacker}`);
        } else {
          floaters.push({
            id: id++,
            x: e.x,
            text: `-${e.damage}`,
            tone: "hit",
          });
          lines.push(`${e.attacker} hits ${e.target} for ${e.damage}`);
        }
        break;
      case "death":
        floaters.push({ id: id++, x: e.x, text: "DEFEATED", tone: "death" });
        lines.push(`${e.unit} is defeated`);
        break;
      case "skill":
        // M30 will visualize skills; for now the feed just narrates the cast.
        floaters.push({ id: id++, x: e.x, text: e.skillId, tone: "skill" });
        lines.push(`${e.caster} casts ${e.skillId}`);
        break;
    }
  }

  return { floaters, lines, nextId: id };
}
