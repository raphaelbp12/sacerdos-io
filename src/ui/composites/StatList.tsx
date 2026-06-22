import { KeyValueList } from "../primitives";
import type { Stat } from "../../domain/stats";

/** The canonical attributes surfaced on the Character screen. */
const PRIMARY_STATS: readonly Stat[] = [
  "hp",
  "attack",
  "physicalDamage",
  "armor",
];

/** A label→value list of a character's computed stats. */
export function StatList({
  stats,
  only = PRIMARY_STATS,
}: {
  stats: Record<Stat, number>;
  only?: readonly Stat[];
}) {
  return (
    <KeyValueList
      rows={only.map((stat) => ({
        key: stat,
        label: stat,
        value: stats[stat],
      }))}
    />
  );
}
