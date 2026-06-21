# Milestone 7 Plan — Class, levels, skill points, passives

> **Goal:** a `Character` gets its base stats from **class + level**, earns 1 refundable skill
> point per level, and spends them on data-defined **passives** (a `ModifierSource`). Delivers
> part of **D-008** (the level → base-stat curve). Skills themselves are **M8** — here we only
> reserve their band slots in the choice model.
>
> **Headline acceptance test:** a level-10 Knight with the "increase attack" passive maxed
> (10 levels → +20 attack) reports the expected `attack` via `getStat`, and refunding those
> points restores the spent skill points.

---

## 0. Confirmed decisions (resolved with the user before coding)

1. **Band model.** Every passive **and** skill carries an explicit `band` (1–4), where
   band _b_ unlocks at character level `10·(b−1)+1` (i.e. bands 1–10 / 11–20 / 21–30 / 31–40).
2. **Knight passive→band split (2/2/2/1):**
   - **Band 1:** increase attack, increase hp
   - **Band 2:** increase damage %, increase armor
   - **Band 3:** increase attack speed %, increase block chance
   - **Band 4:** increase elemental resistance %
3. **Knight skill→band split (1 per band, overview list order):** smash (b1), shatter (b2),
   raise shield (b3), provoke (b4). _Skill **definitions/effects** are M8;_ M7 only registers
   their band + max-rank so the skill-point allocator can gate and cap them.
4. **Elemental-resistance passive** modifies **all four** resists (`fireResist`, `coldResist`,
   `lightningResist`, `chaosResist`) equally, +10%/level, max 5.
5. **Wiring (7.5):** keep `Character` generic (it already accepts `baseStats` + `sources`). Add
   a thin **composition helper** `createCharacter(classDef, level, allocation, extraSources)`
   that feeds `baseStatsForLevel(...)` as the base and the passive `ModifierSource` as a source.
   No change to `Character`'s contract.

---

## 1. Passive data (from the overview)

| id                 | label                          | stat(s)       | kind       | per-level | max |
| ------------------ | ------------------------------ | ------------- | ---------- | --------- | --- |
| `attack`           | increase attack                | `attack`      | flat       | +2        | 10  |
| `damage`           | increase damage %              | `damage`      | flat-frac  | +0.03     | 10  |
| `hp`               | increase hp                    | `hp`          | flat       | +15       | 10  |
| `attack-speed`     | increase attack speed %        | `attackSpeed` | percentage | +0.02     | 10  |
| `block-chance`     | increase block chance          | `blockChance` | flat-frac  | +0.03     | 10  |
| `elemental-resist` | increase elemental resistance% | all 4 resists | flat-frac  | +0.10     | 5   |
| `armor`            | increase armor                 | `armor`       | flat       | +15       | 10  |

> Each passive expands to one `Modifier` **per target stat**, value = `perLevel · rank`.
> `attackSpeed` uses `percentage` (the stat accepts it); fraction stats use `flat`.

---

## 2. Steps (TDD order)

- [x] **7.1 `class-def.ts`** — `ClassDef` (id, name, `baseStatsAtLevel1`, `perLevelGains`) +
      `KNIGHT` (L1 100 hp / 10 attack / 10 armor; +10 hp / +1 attack / +3 armor per level) +
      `CLASSES`. _Test:_ L1 and L10 anchors via a helper used in 7.2.
- [x] **7.2 `level.ts`** — `baseStatsForLevel(classDef, level)` → `Partial<Record<Stat,number>>`.
      Validates `level ≥ 1`. _Test:_ L1 = base; L10 = 190 hp / 19 attack / 37 armor; monotonic.
- [x] **7.3 `passive-def.ts`** — `PassiveDef` + `KNIGHT_PASSIVES` data; `PassiveAllocation`
      (id → rank) implements `ModifierSource`. _Test:_ "increase attack" rank 10 → +20 attack via
      `getStat`; elemental-resist rank 5 → +0.5 on every resist (clamped ≤ 1); rank 0 emits nothing.
- [x] **7.4 `skill-points.ts`** — `Build` tracks earned points (1/level), spends into a
      passive/skill node by id, refunds freely, enforces band unlock (node band ≤ character band),
      per-node max rank, and total-points budget. _Test:_ over-spend blocked; band-locked node
      rejected; refund restores points & lowers rank; max-rank node rejects further points.
- [x] **7.5 `create-character.ts`** — `createCharacter(classDef, level, build, extraSources?)`
      composes base stats + passive source. _Test:_ a level-10 Knight with attack maxed deals the
      expected `getStat("attack")`; equipment sources still stack on top.

---

## 3. Architecture notes

- New folder `src/domain/character/` depends on **stats only** (and reuses `ModifierSource`).
  Nothing inner imports it; the UI/combat will consume it later. Zero React/DOM/Vite.
- Skills are **registered** here as choice nodes (band + max rank 5) but their **resolution**
  is M8 — `Build` treats passive and skill nodes uniformly (both are "spend ranks into an id").
- Refund is free (overview: "points can be refunded at any time"). Respec cost → deferred.

## 4. Deferrals to log when reached

| ID    | Title                            | Note                                     |
| ----- | -------------------------------- | ---------------------------------------- |
| D-013 | Additional classes beyond Knight | `CLASSES` is a list; only Knight for now |
| D-020 | Respec cost / cooldown           | refund is free in v1                     |
