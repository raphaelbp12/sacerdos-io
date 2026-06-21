# Milestone 9 Plan — Monster / enemy system

> **Goal:** a first-class `Monster` that **implements the `Combatant` contract** (so it plugs
> into M6's `resolveAttack` as attacker _or_ defender with zero combat-code changes), built from
> **data rows** whose canonical stats scale linearly with a stage's **monster level**. The act's
> allowed elements decide whether a monster deals physical or an element. Resolves **D-009**.
>
> **Headline acceptance test:** the same boss-flavoured base, scaled at the same level, deals
> **physical** damage when only `physical` is allowed (act 1) but **fire** when `fire` is also
> allowed (act 2); and a boss is a normal monster with stats × `BOSS_STAT_MULTIPLIER`.

---

## 0. Confirmed decisions (resolved with the user before coding)

1. **Roster.** Seed **three** data rows: two normals — **weak** (`Goblin Grunt`) and **strong**
   (`Orc Brute`) — plus one **boss archetype** (`Ogre Warlord`). Enough variety to prove scaling
   - `Combatant` conformance; the full bestiary stays deferred (D-009 closed to "first roster").
2. **Scaling.** **Linear per-monster gains**, mirroring the class table (M7): a stat at level
   `L` is `base + perLevel × (L − 1)`. Each row carries its own `baseStats` (L1) and
   `perLevelGains`. No shared global curve.
3. **Determinism.** **No `Rng`** in M9 — scaling is fully deterministic. Per-stat random
   variance is **deferred** (new **D-021**); the roadmap's `scaleMonster(base, level, rng)`
   signature drops the `rng` param accordingly.
4. **Element source.** `scaleMonster` takes the act's **`allowedElements`**. A monster declares a
   `preferredElement`; the resolved element is the preferred one **if allowed**, otherwise
   `physical`. The monster's flat damage is routed into the resolved element's damage stat
   (`ELEMENT_DAMAGE_STAT`), so the **same** monster deals physical in act 1 and fire in act 2.
5. **Boss.** A boss is **a normal monster with higher stats** (overview): `scaleBoss` =
   `scaleMonster` with a `statMultiplier` of `BOSS_STAT_MULTIPLIER` (start **3×**), applied
   **before** the floor so `bossStat = floor(rawStat × 3)`.

---

## 1. Design

- **Module home:** new pure module `src/domain/monsters/`. Dependencies point inward only:
  `monsters → combat` (reuses `Combatant`, `DamageElement`, `ELEMENT_DAMAGE_STAT`) and
  `monsters → stats` (`Stat`, `defaultStat`). Nothing inner imports `monsters` (no cycle).
- **`MonsterDef` (data row):** `id`, `name`, `preferredElement`, and two `MonsterStatBlock`s
  (`baseStats` at L1, `perLevelGains`). A `MonsterStatBlock` is the neutral set a monster needs
  to fight: `hp`, `attack`, `armor`, `flatDamage` (routed to the resolved element).
- **`Monster` (runtime):** `implements Combatant` like `TrainingDummy` — a name, a frozen scaled
  stat record, the resolved `element`, a mutable `currentHP`, `takeDamage`, and `reset`. Reads
  unset stats via `defaultStat` so it satisfies the full `Combatant`/defender surface.
- **Compute-don't-store stays intact:** the scaled record is the monster's _base_ stats (the
  analogue of a character's class+level base); only `currentHP` is deliberately stateful.

## 2. Steps (TDD order)

- [ ] **9.1 `monsters/monster-def.ts` + `monster-bases.ts` + `scale-monster.ts`** —
      `MonsterDef`/`MonsterStatBlock` types; `MONSTER_BASES` (weak/strong/boss); `Monster`
      implementing `Combatant`; `scaleMonster(base, level, allowedElements, { statMultiplier })`.
      _Tests:_ deterministic linear scaling (L1 = base, L10 anchors); element resolves to
      `physical` when its preferred element isn't allowed and to the preferred element when it
      is; `flatDamage` lands in `ELEMENT_DAMAGE_STAT[element]`; the scaled monster works as a
      `resolveAttack` defender (takes ≥ 1 damage) and attacker; `level < 1` / non-int rejected.
- [ ] **9.2 boss multiplier** — `BOSS_STAT_MULTIPLIER` + `scaleBoss(base, level, allowedElements)`.
      _Test:_ `scaleBoss` stats = `floor(rawStat × BOSS_STAT_MULTIPLIER)`; at L1 (integer raws)
      this equals the normal scaled stat × 3.

## 3. Out of scope / deferred

- Monster **stat variance** via `Rng` → **D-021**.
- Enemy **AI / behaviours**, enemy **skill-casting** (already D-014), encounter design, and the
  full bestiary — these arrive with the battle engine (M10) and stages (M11).
- **Stage/act gating** of `allowedElements` is formalised in **M11**; M9 only consumes the list.
