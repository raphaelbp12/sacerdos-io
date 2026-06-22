import { describe, it, expect } from "vitest";

import { GameSession } from "./game-session";
import { STARTER_WEAPON } from "./game-session";
import type { GameState, SavedCharacter, SavedGroup } from "../persistence";
import { Wallet } from "../domain/economy";
import { RuneState } from "../domain/runes";
import { Inventory, Stash } from "../domain/items";
import type { Item } from "../domain/items";
import { SeededRng } from "../domain/rng";

// ── reusable balance harness ─────────────────────────────────────────────────

/** A weapon the starter Knight can wield (levelReq 1) — the "found an item" knob. */
function weapon(id: string, attack: number, physicalDamage = 0): Item {
  return {
    id,
    name: id,
    rarity: "Common",
    kind: "equippable",
    levelReq: 1,
    slot: "weapon",
    modifiers: [
      { attribute: "attack", kind: "flat", value: attack },
      ...(physicalDamage
        ? [
            {
              attribute: "physicalDamage" as const,
              kind: "flat" as const,
              value: physicalDamage,
            },
          ]
        : []),
    ],
  };
}

/** A player's total investment expressed as data — the only knobs balance cares about. */
interface PowerTier {
  readonly level?: number;
  readonly weapon?: Item;
  readonly build?: Readonly<Record<string, number>>;
}

/** A single-hero session at `tier`, parked at a stage, under a chosen seed. */
function probe(
  tier: PowerTier,
  actIndex: number,
  stageIndex: number,
  seed: number,
): GameSession {
  const hero: SavedCharacter = {
    id: "hero-1",
    name: "Knight",
    classId: "knight",
    level: tier.level ?? 1,
    build: tier.build ?? {},
    equipment: tier.weapon ? { weapon: tier.weapon } : {},
    attackElement: "physical",
  };
  const group: SavedGroup = {
    id: "group-1",
    capacity: 5,
    formation: ["hero-1"],
  };
  const state: GameState = {
    progression: {
      position: { actIndex, stageIndex },
      difficulty: "normal",
      clearedNormalFinalActBoss: false,
    },
    wallet: new Wallet(0),
    runes: new RuneState(),
    cubeLevel: 0,
    inventory: new Inventory(100),
    stash: new Stash(1, 100),
    characters: [hero],
    groups: [group],
    heroSlots: 3,
    groupSlots: 1,
  };
  return new GameSession(state, new SeededRng(seed));
}

/**
 * Clear rate of `tier` against a stage across many seeds. Balance should never
 * hinge on one lucky roll, so we measure robustness, not a single outcome.
 */
function clearRate(
  tier: PowerTier,
  actIndex: number,
  stageIndex: number,
  seeds = 12,
): number {
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    if (
      probe(tier, actIndex, stageIndex, seed).playStage().status === "cleared"
    )
      wins++;
  }
  return wins / seeds;
}

// ── EXPLORATORY map (skipped; un-skip locally to re-survey the curve) ──────────

describe.skip("balance map (exploratory)", () => {
  it("prints clear-rate across power tiers and act-1 stages", () => {
    const tiers: { label: string; tier: PowerTier }[] = [
      { label: "L1 barehanded (a brand-new player)", tier: {} },
      {
        label: "L1 + weak weapon(+5 atk)",
        tier: { weapon: weapon("w-weak", 5) },
      },
      {
        label: "L1 + strong weapon(+50 atk,+30 dmg)",
        tier: { weapon: weapon("w-strong", 50, 30) },
      },
      {
        label: "L3 + skills(atk2,hp1)",
        tier: { level: 3, build: { attack: 2, hp: 1 } },
      },
      {
        label: "L5 + weapon + skills(atk3,hp2)",
        tier: {
          level: 5,
          weapon: weapon("w-mid", 30, 20),
          build: { attack: 3, hp: 2 },
        },
      },
    ];
    const rows = tiers.map(({ label, tier }) => {
      const cells = [1, 2, 3, 4, 5]
        .map((s) => `${s}:${Math.round(clearRate(tier, 1, s) * 100)}%`)
        .join("  ");
      return `${label.padEnd(40)} ${cells}`;
    });
    process.stdout.write(
      "\nact-1 clear-rate by tier:\n" + rows.join("\n") + "\n",
    );
    expect(rows.length).toBe(tiers.length);
  });
});

// ── progression-gate spec: the intended act-1 onboarding curve (D-041) ─────────
//
// The reusable balance guardrail. It encodes the *designed* curve as data: each
// tier clears its target stage but is **walled** at the next, and the next
// investment breaks through. If a future change flattens the curve (everything
// trivially clears) or breaks it (a tier stops clearing), one of these flips and
// the build fails loudly. Tiers mirror a real player's progression:
//
//   T0  the starter loadout (Worn Short Sword)      → clears 1-1, walled at 1-2
//   T1  a found weapon + a couple of levels/skills  → clears 1-2, walled at 1-3
//   T2  more levels + survivability skills          → clears 1-3
//
// (Why a weapon at all: damage is `attack × physicalDamage × …`, so a barehanded
//  hero deals zero damage and cannot clear any stage — see the first test.)

/** A modest found upgrade: a single-stat `physicalDamage` weapon (uncommon-ish). */
const FOUND_BLADE = weapon("found-blade", 0, 10);

const T0_STARTER: PowerTier = { weapon: STARTER_WEAPON };
const T1_GEARED: PowerTier = {
  level: 3,
  weapon: FOUND_BLADE,
  build: { attack: 2, hp: 1 },
};
const T2_SKILLED: PowerTier = {
  level: 5,
  weapon: FOUND_BLADE,
  build: { attack: 1, hp: 4 },
};

describe("act-1 onboarding curve", () => {
  it("a barehanded hero deals zero damage and clears nothing", () => {
    // Design law, not a bug: with no weapon `physicalDamage` is 0, so every hit
    // is 0. This is why the starter ships with a weapon.
    expect(clearRate({}, 1, 1)).toBe(0);
  });

  it("step 1 — the starter loadout clears stage 1, but is walled at stage 2", () => {
    expect(clearRate(T0_STARTER, 1, 1)).toBe(1);
    expect(clearRate(T0_STARTER, 1, 2)).toBe(0);
  });

  it("a better weapon alone does NOT skip ahead — leveling is required", () => {
    // A fresh L1 hero who finds a stronger blade still can't clear stage 2: gear
    // is not a substitute for levels, so an early rare drop never trivialises the
    // act. The wall moves only when the hero levels up (see step 2).
    expect(clearRate({ weapon: FOUND_BLADE }, 1, 2)).toBe(0);
  });

  it("step 2 — after finding a weapon (+ a few levels), the hero clears stage 2, but is walled at stage 3", () => {
    expect(clearRate(T1_GEARED, 1, 2)).toBe(1);
    expect(clearRate(T1_GEARED, 1, 3)).toBe(0);
  });

  it("step 3 — after more levels + survivability skills, the hero clears stage 3", () => {
    expect(clearRate(T2_SKILLED, 1, 3)).toBe(1);
  });
});
