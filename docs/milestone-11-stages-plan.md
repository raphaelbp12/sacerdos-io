# Milestone 11 Plan — Stages, acts, difficulties, boss keys

> **Goal:** the content structure the auto-battler runs on. **2 acts × 9 stages + an act-boss
> stage**, **2 difficulties** (normal / hard), per-stage **monster level** and **item level**,
> latest-stage advance/retreat **progression** rules, hard-difficulty unlock, and **boss keys**
> that gate the act boss and are consumed only when the boss drops loot. This milestone
> **produces the `Monster[][]` waves** that M10's `StageRunner` already consumes (DRY — the
> runner stays content-agnostic). Delivers the **rest of D-008** (kills award XP, split among
> the living).
>
> **Headline acceptance test:** act 1 stages deal **physical** only; the act-2 stage boss deals
> **fire**; **hard** raises a stage's item level; a stage's total monster count is **fixed**
> (same stage ⇒ same reward); clearing the latest stage **advances** and a wipe **retreats**
> (never below act 1 stage 1); a boss key is **kept** when nothing drops and **consumed** when
> something drops; XP from a kill is split among **living** characters (a dead one earns none).

---

## 0. Decisions (made up-front, no blocking questions)

1. **Module home.** New pure module `src/domain/stages/`. Dependencies point inward only:
   `stages → monsters` (`scaleMonster` / `scaleBoss` / `monsterById`) and `stages → combat`
   (`DamageElement`). It does **not** import `battle`; the outer shell composes `stages`
   (waves) + `battle` (`StageRunner`). Nothing inner imports `stages` (no cycle).
2. **Acts as compact data + a builder.** Each act is a small **tuning row** expanded into its 9
   `StageDef`s by `buildAct` (a linear ramp, mirroring the M7 class-table / level-curve
   approach). Content stays data-driven; the ramp is explicit and deterministic.
3. **Elements come from the act, not the difficulty (v1).** Act 1 = `physical`; act 2 =
   `physical + fire`. The overview's v1 rule is _"for now, the only loot difference between
   difficulties is the item level."_ Per-difficulty extra elements (hard act 2 → cold) are
   **deferred** (new **D-025**).
4. **Difficulty = flat bonuses.** `normal` (unlocked, no bonus) and `hard` (locked until the
   normal final act boss is down; `+itemLevelBonus`, `+monsterLevelBonus`). Difficulty never
   changes the wave _shape_ — only the levels the same waves scale to.
5. **Stage boss vs act boss.** Every stage ends in a **stage-boss** wave (`scaleBoss` of the
   stage's `bossId`). The **act boss** is a separate, key-gated single-boss encounter
   (`buildActBossWaves`). The act boss is _a normal monster with higher stats_ (M9 `scaleBoss`).
6. **Boss keys are a domain concept now, inventory integration later.** A `BossKey` carries the
   `actIndex` it opens; it is consumed only if the boss fight dropped something. Non-stackable
   capacity rules are **M15**; this milestone only models the gate + consumption rule.
7. **XP split is the M11 deliverable; the XP→level curve is a placeholder.** `splitXpAmongLiving`
   (equal floor share to the living, 0 to the dead) + `xpForKill` (per-source). A simple
   triangular `levelForTotalXp` makes XP usable; balancing it is **deferred** (new **D-024**).

---

## 1. Design

- **`difficulty.ts`** — `Difficulty = "normal" | "hard"`; `DifficultyDef`
  (`unlockedByDefault`, `itemLevelBonus`, `monsterLevelBonus`); `DIFFICULTIES`; `difficultyById`.
- **`stage-def.ts`** — `StageDef` (`index`, `name`, `waveSizes`, `monsterId`, `bossId`,
  `monsterLevel`, `itemLevel`, `goldPerMonster`, `xpPerMonster`) + `ActBossDef`.
- **`act-def.ts`** — `ActDef` (`id`, `index`, `name`, `allowedElements`, 9 `stages`, `boss`);
  `buildAct` (compact tuning → 9 stages); `ACTS` (act 1 physical, act 2 +fire); `actByIndex` /
  `stageAt` lookups (throw on out-of-range).
- **`build-waves.ts`** — `buildStageWaves(act, stage, difficulty)` → `Monster[][]`
  (regular waves + a final stage-boss wave); `buildActBossWaves(act, difficulty)`;
  `stageItemLevel` / `stageMonsterLevel` (base + difficulty bonus).
- **`progression.ts`** — `StagePosition {actIndex, stageIndex}` (1-based); `advance` /
  `retreat` (clamped to `[act1 stage1, lastAct stage9]`); `isFinalStage`;
  `isDifficultyUnlocked`.
- **`boss-key.ts`** — `BossKey {actIndex}`; `makeBossKey`; `hasBossKeyFor`;
  `settleBossKeyAfterFight(keys, actIndex, droppedSomething)` (consume one iff a drop).
- **`xp.ts`** — `KillSource`; `xpForKill`; `splitXpAmongLiving`; placeholder
  `xpRequiredForLevel` / `levelForTotalXp` (D-024).

## 2. Steps (TDD order)

- [x] **11.1 `difficulty.ts`** — types + `DIFFICULTIES` + `difficultyById`. _Tests:_ normal
      unlocked / zero bonus; hard locked / positive bonuses; unknown id throws.
- [x] **11.2 `stage-def.ts` + `act-def.ts`** — `StageDef`/`ActBossDef`/`ActDef`; `buildAct`;
      `ACTS`; `actByIndex` / `stageAt`. _Tests:_ each act has 9 stages; monster/item level ramp
      monotonically; act 1 `allowedElements` = `[physical]`, act 2 = `[physical, fire]`;
      lookups throw out of range.
- [x] **11.3 `build-waves.ts`** — `buildStageWaves` / `buildActBossWaves` /
      `stageItemLevel` / `stageMonsterLevel`. _Tests:_ wave count = `waveSizes.length + 1`
      and total monster count fixed; act-1 monsters deal `physical`; the act-2 stage boss deals
      `fire`; **hard** raises the stage's item level & monster level.
- [x] **11.4 `progression.ts`** — `advance` / `retreat` / `isFinalStage` /
      `isDifficultyUnlocked`. _Tests:_ clear advances (stage→stage, act 9→next act 1, capped at
      final); wipe retreats (never below act 1 stage 1); hard locked until the normal final act
      boss is cleared.
- [x] **11.5 `boss-key.ts`** — `makeBossKey` / `hasBossKeyFor` / `settleBossKeyAfterFight`.
      _Tests:_ key kept when nothing drops; one key consumed when something drops; a key for a
      different act is untouched.
- [x] **11.6 `xp.ts`** — `xpForKill` / `splitXpAmongLiving` / `levelForTotalXp`. _Tests:_ boss
      sources award more; XP splits equally among the living and a dead member earns **0**;
      `levelForTotalXp` is monotonic and matches `xpRequiredForLevel` anchors.
- [x] **11.7 `index.ts`** — public barrel; whole suite + lint + build green.

## 3. Deferrals to log

| ID    | Title                                             | Why deferred                                     |
| ----- | ------------------------------------------------- | ------------------------------------------------ |
| D-024 | XP → level curve balancing                        | M11 ships a placeholder triangular curve         |
| D-025 | Per-difficulty extra elements (hard act 2 → cold) | v1 difficulty differs only by item/monster level |
