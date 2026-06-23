import type { CSSProperties } from "react";
import type { BattleUnit } from "../../domain/battle";
import { ENEMY_SPAWN_X, PARTY_START_X } from "../../domain/battle";
import { UnitCard } from "./UnitCard";

/**
 * The live battlefield (M22): lays the party and the current enemy wave along the 1D
 * line by each unit's `x`, so the player watches them close the gap and trade blows
 * with HP bars draining in real time. M24 overlays floating combat numbers.
 *
 * Positioning is the one place the harness's "no inline styles" rule bends: each unit's
 * normalized position is fed in as a CSS custom property (`--unit-x`) read by the
 * `.battle-unit` / `.floater` classes. This is scoped to this one composite — see
 * deferral **D-043**.
 */

/** A transient combat number rising over the battlefield (M24). */
export interface Floater {
  readonly id: number;
  /** Battlefield `x` the number rises from. */
  readonly x: number;
  readonly text: string;
  /** Visual tone → `floater--<tone>` class. */
  readonly tone: "hit" | "block" | "dodge" | "death" | "skill";
}

/** Padding (in battlefield units) added on each side so spawned units aren't clipped. */
const VIEW_PAD = 80;
const VIEW_MIN = ENEMY_SPAWN_X - VIEW_PAD;
const VIEW_MAX = PARTY_START_X + VIEW_PAD;

/** Map a battlefield `x` to a 0–100% horizontal position within the strip. */
function battlePositionPercent(x: number): number {
  const span = VIEW_MAX - VIEW_MIN;
  const pct = ((x - VIEW_MIN) / span) * 100;
  return Math.min(100, Math.max(0, pct));
}

function xStyle(x: number): CSSProperties {
  return { "--unit-x": `${battlePositionPercent(x)}%` } as CSSProperties;
}

function PlacedUnit({ unit }: { unit: BattleUnit }) {
  return (
    <div
      className={`battle-unit battle-unit--${unit.side}`}
      style={xStyle(unit.x)}
    >
      <UnitCard unit={unit} />
    </div>
  );
}

export function BattleStrip({
  party,
  enemies,
  floaters = [],
}: {
  party: readonly BattleUnit[];
  enemies: readonly BattleUnit[];
  floaters?: readonly Floater[];
}) {
  return (
    <div className="battle-strip">
      {[...party, ...enemies].map((unit, i) => (
        <PlacedUnit key={`${unit.side}-${i}-${unit.name}`} unit={unit} />
      ))}
      {floaters.map((f) => (
        <span
          key={f.id}
          className={`floater floater--${f.tone}`}
          style={xStyle(f.x)}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}
