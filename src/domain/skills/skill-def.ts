import type { ChoiceNode } from "../character";
import { KNIGHT_SKILL_NODES } from "../character";
import type { DamageElement } from "../combat";

/**
 * How a skill resolves (M8). The resolver dispatches on this:
 *   - `damage`     : single-target multiplier of a basic hit (smash).
 *   - `areaDamage` : same damage math, tagged for multi-target fan-out (M10) (shatter).
 *   - `buff`       : a charge-based self buff via `ChargeTracker` (raise-shield).
 *   - `debuff`     : a permanent negative modifier on the target via `BuffTracker` (provoke).
 */
export type SkillKind = "damage" | "areaDamage" | "buff" | "debuff";

/**
 * Coarse range tag. Concrete distances are deliberately deferred (D-015 — "tune
 * live") until the battle has positions (M10).
 */
export type SkillRange = "self" | "short" | "long" | "area";

/**
 * A skill as DATA. It extends the build `ChoiceNode` (id/band/maxRank live in
 * `character/`, single-sourced) and adds the combat-resolution fields.
 *
 * `values[rank - 1]` is interpreted by `kind`:
 *   - damage / areaDamage : multiplier of the basic final damage (e.g. 3.0 = 300%).
 *   - buff                : number of charges (e.g. 5 hits).
 *   - debuff              : the (signed) modifier value applied to the target.
 */
export interface SkillDef extends ChoiceNode {
  readonly name: string;
  readonly kind: SkillKind;
  /** Base cooldown in milliseconds, before cooldown reduction. */
  readonly cooldownMs: number;
  readonly range: SkillRange;
  /** Damage element. Knight skills are physical. */
  readonly element: DamageElement;
  /** One value per rank; `values.length === maxRank`. */
  readonly values: readonly number[];
}

/** Combat-resolution data keyed by skill id; merged onto the build nodes (DRY). */
type SkillCombatData = Omit<SkillDef, keyof ChoiceNode>;

const KNIGHT_SKILL_COMBAT: Readonly<Record<string, SkillCombatData>> = {
  smash: {
    name: "Smash",
    kind: "damage",
    cooldownMs: 3000,
    range: "short",
    element: "physical",
    values: [2.0, 2.5, 3.0, 3.5, 4.0],
  },
  shatter: {
    name: "Shatter",
    kind: "areaDamage",
    cooldownMs: 3000,
    range: "area",
    element: "physical",
    values: [1.0, 1.25, 1.5, 1.75, 2.0],
  },
  "raise-shield": {
    name: "Raise Shield",
    kind: "buff",
    cooldownMs: 3000,
    range: "self",
    element: "physical",
    values: [3, 4, 5, 6, 7],
  },
  provoke: {
    name: "Provoke",
    kind: "debuff",
    cooldownMs: 3000,
    range: "long",
    element: "physical",
    values: [-0.2, -0.3, -0.4, -0.5, -0.6],
  },
};

/**
 * The Knight's four skills, built by merging combat data onto the registered
 * build nodes so band + max rank stay single-sourced in `character/`.
 */
export const KNIGHT_SKILLS: readonly SkillDef[] = KNIGHT_SKILL_NODES.map(
  (node: ChoiceNode): SkillDef => {
    const combat = KNIGHT_SKILL_COMBAT[node.id];
    if (!combat) {
      throw new Error(`No combat data defined for skill node "${node.id}".`);
    }
    return { ...node, ...combat };
  },
);

const SKILLS_BY_ID: ReadonlyMap<string, SkillDef> = new Map(
  KNIGHT_SKILLS.map((s) => [s.id, s]),
);

/** Looks up a skill by id. Throws if unknown. */
export function skillById(id: string): SkillDef {
  const skill = SKILLS_BY_ID.get(id);
  if (!skill) {
    throw new Error(`Unknown skill "${id}".`);
  }
  return skill;
}
