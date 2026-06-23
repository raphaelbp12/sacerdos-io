import type { BattleUnit } from "../../domain/battle";
import { ProgressBar, Badge } from "../primitives";
import { cx } from "../primitives/cx";

/**
 * One battlefield unit (M22): name, an HP {@link ProgressBar}, and a side/element
 * {@link Badge}. Dimmed (via `battle-unit--dead`) once defeated. Purely presentational —
 * it reads the live {@link BattleUnit} but stores nothing.
 */
export function UnitCard({ unit }: { unit: BattleUnit }) {
  const maxHp = Math.max(1, Math.round(unit.combatant.getStat("hp")));
  const hp = Math.max(0, Math.ceil(unit.combatant.currentHP));
  const alive = unit.isAlive;
  const sideTone = unit.side === "party" ? "good" : "bad";

  return (
    <div className={cx("unit-card", !alive && "unit-card--dead")}>
      <span className="unit-card__name">{unit.name}</span>
      <ProgressBar value={hp} max={maxHp} good={unit.side === "party"} />
      <div className="unit-card__tags">
        <Badge tone={sideTone}>{hp}</Badge>
        {unit.attackElement !== "physical" && (
          <Badge tone="accent">{unit.attackElement}</Badge>
        )}
      </div>
    </div>
  );
}
