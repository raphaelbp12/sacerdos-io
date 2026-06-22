import type { DamageElement } from "../combat";
import type { ActBossDef, StageDef } from "./stage-def";

/**
 * An act: 9 stages + a key-gated act-boss encounter (M11).
 *
 * Acts are authored as compact **tuning rows** (`ActTuning`) and expanded into
 * their 9 `StageDef`s by `buildAct` — a linear ramp, mirroring the M7 class
 * table / level curve. Content stays data-driven; the ramp is explicit and
 * deterministic, so a stage always yields the same monsters (fixed reward).
 */
export interface ActDef {
  readonly id: string;
  /** 1-based act index. */
  readonly index: number;
  readonly name: string;
  /** Elements monsters in this act may deal (act 1 = physical only). */
  readonly allowedElements: readonly DamageElement[];
  readonly stages: readonly StageDef[];
  readonly boss: ActBossDef;
}

interface ActTuning {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly allowedElements: readonly DamageElement[];
  /** Archetype filling the early (weaker) stages. */
  readonly weakMonsterId: string;
  /** Archetype filling the later (stronger) stages. */
  readonly strongMonsterId: string;
  /** Archetype scaled for each stage boss. */
  readonly stageBossId: string;
  /** Archetype scaled for the act boss. */
  readonly actBossId: string;
  /** Monster/item level of stage 1; later stages add `index - 1`. */
  readonly baseLevel: number;
  /** Gold a normal monster gives on stage 1; later stages add `index - 1`. */
  readonly baseGoldPerMonster: number;
  /** XP a normal monster gives on stage 1; later stages add `2 × (index - 1)`. */
  readonly baseXpPerMonster: number;
}

const STAGES_PER_ACT = 9;

/** Expand a compact act tuning into a full `ActDef` (9 stages + act boss). */
export function buildAct(t: ActTuning): ActDef {
  const stages: StageDef[] = Array.from({ length: STAGES_PER_ACT }, (_, i) => {
    const index = i + 1;
    // 2 waves for stages 1–3, 3 for 4–6, 4 for 7–9 — each wave holds 3 monsters.
    const waveCount = 2 + Math.floor(i / 3);
    return {
      index,
      name: `${t.name} - Stage ${index}`,
      waveSizes: Array<number>(waveCount).fill(3),
      monsterId: index <= 5 ? t.weakMonsterId : t.strongMonsterId,
      bossId: t.stageBossId,
      monsterLevel: t.baseLevel + i,
      itemLevel: t.baseLevel + i,
      goldPerMonster: t.baseGoldPerMonster + i,
      xpPerMonster: t.baseXpPerMonster + 2 * i,
    };
  });

  const bossLevel = t.baseLevel + STAGES_PER_ACT;
  const boss: ActBossDef = {
    name: `${t.name} Boss`,
    bossId: t.actBossId,
    monsterLevel: bossLevel,
    itemLevel: bossLevel,
    goldReward: (t.baseGoldPerMonster + STAGES_PER_ACT) * 50,
    xpReward: t.baseXpPerMonster * 50,
  };

  return {
    id: t.id,
    index: t.index,
    name: t.name,
    allowedElements: t.allowedElements,
    stages,
    boss,
  };
}

/**
 * The act database (first content — 2 acts).
 * - Act 1: physical only.
 * - Act 2: physical + fire (fire-flavoured archetypes start dealing fire).
 */
export const ACTS: readonly ActDef[] = [
  buildAct({
    id: "act-1",
    index: 1,
    name: "Act 1",
    allowedElements: ["physical"],
    weakMonsterId: "goblin-grunt",
    strongMonsterId: "orc-brute",
    stageBossId: "goblin-grunt",
    actBossId: "ogre-warlord",
    baseLevel: 1,
    baseGoldPerMonster: 1,
    baseXpPerMonster: 5,
  }),
  buildAct({
    id: "act-2",
    index: 2,
    name: "Act 2",
    allowedElements: ["physical", "fire"],
    weakMonsterId: "goblin-grunt",
    strongMonsterId: "orc-brute",
    stageBossId: "ogre-warlord",
    actBossId: "ogre-warlord",
    baseLevel: 10,
    baseGoldPerMonster: 10,
    baseXpPerMonster: 20,
  }),
];

/** Look up an act by its 1-based index. Throws if out of range. */
export function actByIndex(index: number): ActDef {
  const act = ACTS.find((a) => a.index === index);
  if (!act) throw new Error(`no act at index ${index}`);
  return act;
}

/** Look up a stage by 1-based act + stage index. Throws if out of range. */
export function stageAt(actIndex: number, stageIndex: number): StageDef {
  const act = actByIndex(actIndex);
  const stage = act.stages.find((s) => s.index === stageIndex);
  if (!stage) {
    throw new Error(`no stage ${stageIndex} in act ${actIndex}`);
  }
  return stage;
}
