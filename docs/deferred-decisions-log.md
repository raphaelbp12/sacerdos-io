# Deferred Decisions Log

> **Purpose.** A single running record of every feature, system, or refinement we
> consciously chose **not** to build yet. Each milestone tends to surface "we could go
> deeper here, but not now" moments. Capturing them keeps two failure modes away:
>
> 1. **Lost rationale** — forgetting _why_ something was skipped and re-litigating it.
> 2. **Silent neglect** — deferring something and then never revisiting it.
>
> **How to use this file.**
>
> - Whenever we defer something, **append an entry** (don't edit history) to the table below.
> - Give it a stable **ID** (`D-001`, `D-002`, …) so other docs and code `TODO`s can reference it.
> - Fill in **what**, **why deferred**, and a **revisit trigger** — the concrete condition that
>   should make us pick it back up (e.g. "once combat exists", "when a designer asks for X").
> - When we finally implement one, change its **Status** to `Done (Milestone N)` rather than
>   deleting the row — the history is useful.
>
> Status values: `Deferred` · `Planned (Milestone N)` · `Done (Milestone N)` · `Dropped`.

---

## Index

| ID    | Title                                      | Deferred in | Status   | Revisit trigger (short)                                      |
| ----- | ------------------------------------------ | ----------- | -------- | ------------------------------------------------------------ | --- | ----- | -------------------------- | --- | -------- | ------------------------------------------------- | --- | ----- | ------------------------------------- | --- | -------- | ---------------------------------------------------- |
| D-001 | Affix system (prefixes/suffixes)           | M5          | Deferred | After combat makes loot quality matter                       |
| D-002 | Modifier value _ranges_ (min–max)          | M5          | Resolved | Resolved in M16 (material rolls draw within a min–max band)  |
| D-003 | Multiple modifiers per item                | M5          | Resolved | Resolved in M16 (sockets stack materials on one item)        |
| D-004 | Named / unique items & crafting            | M5          | Deferred | After affixes; needs a baseline of item depth                |
| D-005 | Drop tables / loot sources                 | M5          | Resolved | Resolved in M14 (drop tables + chests)                       |
| D-006 | Consumable generation                      | M5          | Deferred | When consumables need variety beyond seed set                |
| D-007 | Persistence (save / load)                  | M5          | Deferred | When losing state between sessions becomes painful           |
| D-008 | XP / leveling system                       | pre-M6      | Resolved | Level curve M7; kills award XP (split) M11 (D-024 tunes)     |
| D-009 | Enemy / monster system                     | pre-M6      | Resolved | Built in M9 (`src/domain/monsters/`)                         |
| D-010 | Stat cache / memoization                   | M1          | Deferred | Only if profiling shows getStat() is a hotspot               |
| D-011 | Skills as class-gated buffs                | M3          | Resolved | Built in M8 (`src/domain/skills/`)                           |
| D-012 | Advanced on-hit effects                    | M6          | Deferred | When gear/skills need regen, leech, per-hit effects          |
| D-013 | Additional classes beyond Knight           | M7          | Deferred | When a second class / class-select UI is wanted              |
| D-014 | Enemy skill-casting                        | M8          | Deferred | When monsters need fireball / cold-bolt abilities            |
| D-015 | Concrete skill ranges ("tune live")        | M8          | Deferred | When the battle has positions (M10) to tune against          |
| D-020 | Respec cost / cooldown                     | M7          | Deferred | If free refunds make builds feel weightless                  |
| D-021 | Monster stat variance (rng roll)           | M9          | Deferred | When fights feel too uniform / need per-spawn spread         |
| D-016 | Battle visuals / formation UI / juice      | M10         | Deferred | When the battle needs a real-time view & polish              |     | D-017 | Paid-revive cost balancing | M12 | Deferred | When the revive economy needs real pricing/tuning |     | D-022 | Per-unit / stat-driven movement speed | M10 | Deferred | When unit speed should differ (ranged kiting, haste) |
| D-023 | Buff / debuff skills applied in-battle     | M10         | Deferred | When combatants can carry dynamic modifier sources           |
| D-024 | XP → level curve balancing                 | M11         | Deferred | When leveling pace needs tuning against content              |
| D-025 | Per-difficulty extra elements              | M11         | Deferred | When hard should add elements (e.g. act 2 → cold)            |
| D-026 | Gold scaling / balance curve               | M13         | Deferred | When rune buffs (M18) + stage spread allow real tuning       |
| D-027 | Type-2/3 sockets & Immortal/Mythical tiers | M16         | Deferred | When the Rarity union expands past Legendary                 |
| D-028 | Engraving 50/50 dual-stat roll             | M16         | Deferred | When engraving needs its random-of-two-stats depth           |
| D-029 | Full material catalogue                    | M16         | Deferred | When content/balancing needs the complete gem table          |
| D-018 | Cube crafting / offering / etc. operations | M17         | Deferred | When item depth needs craft/offer/decorate/engrave/inscribe  |
| D-030 | Cube gold/EXP weighting & curve tuning     | M17         | Deferred | When the cube economy needs material/gear weighting + tuning |
| D-019 | Second currency + character/group shop     | M19         | Deferred | When acquiring characters/groups needs a shop + currency     |
| D-034 | Per-group formation capacity value         | M19         | Deferred | When formation size needs tuning / a stat or rune source     |

---

## Detailed entries

### D-001 — Affix system (prefixes / suffixes)

- **What:** Items roll named affixes (e.g. "of the Bear" → +STR; "Heavy" prefix → +HP),
  rather than a single anonymous flat modifier. Each affix is data with its own
  attribute(s), tier, and value range.
- **Why deferred (M5):** M5 deliberately rolled **one** flat modifier per item to ship the
  generation loop. Affixes are the depth layer; adding them before there's a reason to
  compare items would be polishing a machine nobody pulls.
- **Revisit trigger:** Once a consumer of stats exists (combat — see Milestone 6) so that a
  "better" item is observably better. Then affixes become the natural depth investment.
- **Related:** `// TODO: roll affix count by rarity` in
  [src/domain/items/generate-item.ts](../src/domain/items/generate-item.ts).

### D-002 — Modifier value ranges (min–max rolls)

- **What:** A modifier rolls a random value within a band (e.g. +4 to +8 AGI at this level),
  instead of a single deterministic curve value. Two same-rarity drops would differ.
- **Why deferred (M5):** M5 uses one `baseValueForLevel(level)` value so generation is simple
  and fully deterministic to test. Ranges add the "is this roll good?" excitement but need
  the affix structure to be meaningful.
- **Revisit trigger:** Together with D-001. The `Rng` seam already supports it.
- **Resolved (M16):** materials (`src/domain/items/material.ts`) carry per-category `{min,max}`
  bands and `rollMaterial` draws a value within them via the injected `Rng`. The same band
  pattern is ready to extend to base-item affixes when D-001 lands.

### D-003 — Multiple modifiers per item

- **What:** Items carry several modifiers, with the **count scaling by rarity** (Common 1,
  Legendary 4–6), as PoE/Diablo do.
- **Why deferred (M5):** Hard-coded to one modifier in `generateItem`. Multi-modifier rolls
  only feel good once each modifier is a meaningful affix (D-001) and there's a reason to
  weigh trade-offs (combat).
- **Revisit trigger:** Implement with D-001/D-002 as one "loot depth" milestone.
- **Resolved (M16):** an item now carries multiple modifiers via **sockets** — `applyMaterial`
  adds material modifiers that `effectiveModifiers` aggregates alongside the base affix, and the
  socket **count scales by rarity** (`SOCKET_LAYOUT`). Multi-affix on the base item itself still
  waits on D-001.

### D-004 — Named / unique items & crafting

- **What:** Hand-authored uniques with bespoke modifier combinations; player-driven crafting
  (reroll/upgrade affixes).
- **Why deferred (M5):** Requires the affix system as a substrate. Premature without it.
- **Revisit trigger:** After D-001–D-003 land and loot has baseline depth.

### D-005 — Drop tables / loot sources

- **What:** Rules for _what drops where_: which enemy/chest/encounter yields what `itemLevel`
  and rarity bias. Currently items are generated by a UI button with a fixed item level.
- **Why deferred (M5):** There is no source of drops yet (no enemies, no encounters). A drop
  table with nothing to drop from is empty scaffolding.
- **Revisit trigger:** When the combat/enemy system (M6+) can _award_ loot on victory.
- **Resolved (M14):** `src/domain/loot/` adds data-driven `DropTable`s (weighted rarity "grade
  odds" + item category) rolled via `Rng` and routed through `generateItem`; `Chest`/`openChest`
  with a guaranteed 100% first-drop class weapon; capacity-capped `ChestInventory`. The remaining
  **tuning** — per-source chest drop chances (monster→common, stage-boss→rare, act-boss→legendary;
  first-chest 16% gate) and rare/legendary grade odds — are placeholders tied to stage spread +
  rune drop-rate buffs (M18), tracked under D-026.

### D-006 — Consumable generation

- **What:** Procedurally generated consumables (potions/elixirs of varying potency), not just
  the hand-authored seed set.
- **Why deferred (M5):** M5 scoped generation to **equippables**. Consumables are a small,
  fixed seed set and that's sufficient for now.
- **Revisit trigger:** When consumable variety becomes a player-facing need (e.g. tiered
  potions tied to item level).

### D-007 — Persistence (save / load)

- **What:** Serialize character, equipment, inventory, and active buffs so progress survives a
  page reload. State currently lives only in React memory.
- **Why deferred (M5):** Nothing yet accrues that's painful to lose (no progression, no
  combat results). Persistence is utility, not value, until there's progress worth keeping.
- **Revisit trigger:** Once XP/leveling (D-008) or combat outcomes make a session's progress
  worth preserving.

### D-008 — XP / leveling system

- **What:** The character _earns_ levels (from combat or quests), which gates equippable
  `levelReq` and the `itemLevel` of generated loot. Today `CHARACTER_LEVEL` is a hardcoded
  constant in the UI.
- **Why deferred (pre-M6):** Leveling only matters once there's an activity that grants
  progression (combat) and a reason to chase higher-level gear.
- **Revisit trigger:** After minimal combat (M6) exists to award XP.

### D-009 — Enemy / monster system

- **What:** A first-class enemy entity with its own stats, behaviors, and variety.
- **Why deferred (pre-M6):** Milestone 6 introduces only a **minimal "training dummy"** — the
  smallest possible combat consumer — rather than a full enemy system. A full bestiary,
  enemy AI, and encounter design are out of scope until the core combat resolve is proven.
- **Revisit trigger:** Once the M6 combat tick works and we want real opponents and drop
  sources (ties to D-005).
- **Resolved (M9):** `src/domain/monsters/` adds `MonsterDef` data rows (`MONSTER_BASES`) and
  `scaleMonster`/`scaleBoss`, producing a `Monster` that implements the `Combatant` contract.
  Full bestiary, enemy AI, and skill-casting (D-014) remain out of scope until M10/M11.

### D-010 — Stat cache / memoization

- **What:** Cache `getStat()` results and invalidate on equipment/buff change, instead of
  recomputing on every read.
- **Why deferred (M1):** Locked in [game-plan.md](game-plan.md) — "compute, don't store",
  cache is premature. Recompute is correct and fast enough.
- **Revisit trigger:** Only if profiling shows `getStat()` is a measured hotspot.

### D-011 — Skills as class-gated buffs

- **What:** Player-usable skills/abilities, modeled as named `Buff`s gated by class — reusing
  the existing `BuffTracker.apply` machinery (the plan notes "skills emerge for free").
- **Why deferred (M3):** No class system or skill UI yet; the buff machinery exists but is
  only triggered by consumables.
- **Revisit trigger:** When a class system or an active-skill UI is desired.
- **Status:** **Resolved (M8).** The Knight's four skills are data-defined in
  [src/domain/skills/skill-def.ts](../src/domain/skills/skill-def.ts) (`KNIGHT_SKILLS`, gated by
  the M7 band model). Resolution reuses M6's mitigated `basicHitDamage` (smash/shatter as a
  multiplier), `BuffTracker` with `duration: Infinity` for the permanent provoke debuff, and a
  new charge-based `ChargeTracker` for raise-shield's "next N hits". Cooldowns run on an injected
  `Clock` via `CooldownTracker`.

### D-012 — Advanced on-hit effects (regen, leech, per-hit/kill)

- **What:** Effects that fire _during_ combat beyond a flat hit: HP/second regeneration, life
  leech (% of damage dealt returned as HP), and "per hit" / "per kill" triggers (e.g. +HP on
  kill) seen in [material-effects.md](material-effects.md).
- **Why deferred (M6):** M6 resolves a single physical hit (damage formula + defense order)
  through a `Combatant` contract. On-hit/over-time effects need a battle tick (M10) and a
  richer effect-trigger system to be meaningful; adding them now would be untested machinery.
- **Revisit trigger:** When the battle engine (M10) ticks combat over time and item modifiers
  (M16) introduce leech/regen affixes.

### D-013 — Additional classes beyond Knight

- **What:** More playable classes (mage, ranger, …), each with its own per-level stat path and
  its own passive/skill choice nodes per band.
- **Why deferred (M7):** the overview says "let's start with one single class." M7 built the
  class system as **data** (`CLASSES` is a list; `ClassDef` carries the stat table; passive /
  skill nodes are keyed by band), so adding a class is new data, not engine work — there is no
  reason to author more classes before combat proves the Knight is fun.
- **Revisit trigger:** When combat/roster (M10/M19) make a second archetype desirable, or a
  class-select screen is built.
- **Related:** `CLASSES` in [src/domain/character/class-def.ts](../src/domain/character/class-def.ts).

### D-014 — Enemy skill-casting (fireball / cold-bolt)

- **What:** Monsters cast skills of their own (the overview hints at fireball / cold-bolt as
  enemy abilities), not just basic attacks.
- **Why deferred (M8):** M8 builds **player** skills (the Knight's four) on the `Combatant`
  contract. Enemy AI and an enemy skill catalog need the monster system (M9) and the battle
  engine's targeting/tick (M10) to be meaningful; the skill-resolution machinery
  (`resolveSkillDamage` / trackers) is already generic over `Combatant`, so a monster can reuse
  it later with no engine change.
- **Revisit trigger:** When monsters (M9) and the battle loop (M10) exist and enemies need
  threatening abilities.

### D-015 — Concrete skill ranges ("tune live")

- **What:** Real distances for each skill (smash short, provoke long, shatter's area radius via
  `areaOfEffect`), instead of the coarse `SkillRange` tag (`self`/`short`/`long`/`area`).
- **Why deferred (M8):** the overview explicitly says "I cannot define the range for each skill
  yet, we will need to test it live." There are no positions to tune against until the 1D
  battlefield (M10) exists; M8 keeps `range` as a tag on `SkillDef`.
- **Revisit trigger:** When the battle engine (M10) introduces positions and range checks.
- **Related:** `SkillRange` in [src/domain/skills/skill-def.ts](../src/domain/skills/skill-def.ts).

### D-020 — Respec cost / cooldown

- **What:** A price (gold, a currency, or a time cooldown) for refunding and re-spending skill
  points, instead of the current free, instant re-spec.
- **Why deferred (M7):** the overview explicitly wants free refunds in v1 ("points can be
  refunded at any time") to encourage experimentation. `Build.refund` is a pure operation, so a
  cost layer can wrap it later without touching the allocation rules.
- **Revisit trigger:** If economy tuning (M13) or balance shows free re-spec trivializes builds.
- **Related:** `Build.refund` in [src/domain/character/skill-points.ts](../src/domain/character/skill-points.ts).

### D-021 — Monster stat variance (rng roll)

- **What:** Per-spawn randomized variance on a monster's scaled stats (e.g. a small ± roll on
  hp/attack) so two spawns of the same archetype at the same level differ slightly.
- **Why deferred (M9):** M9 keeps `scaleMonster` **fully deterministic** (no `Rng` param) to
  ship the data-driven scaling + `Combatant` conformance with reproducible tests. The roadmap's
  `scaleMonster(base, level, rng)` signature dropped `rng` accordingly.
- **Revisit trigger:** When fights feel too uniform, or the battle engine (M10) wants per-spawn
  spread. `scaleMonster` can take an optional injected `Rng` without changing call sites.
- **Related:** [src/domain/monsters/scale-monster.ts](../src/domain/monsters/scale-monster.ts).

---

### D-016 — Battle visuals / formation UI / juice

- **What:** A real-time battlefield view (unit positions, HP bars, attack/skill animations,
  damage numbers) and a formation-editing UI, plus general game-feel polish.
- **Why deferred (M10):** M10 builds the **pure** battle engine (`tick`, targeting, movement,
  waves) and verifies it with deterministic assertions. The outer shell can drive `tick` from a
  `requestAnimationFrame`/interval loop later; visuals are an outer-layer concern that must not
  leak into the pure domain.
- **Revisit trigger:** When the engine is stable and a playable real-time view is wanted.
- **Related:** [src/domain/battle/battle.ts](../src/domain/battle/battle.ts).

### D-022 — Per-unit / stat-driven movement speed

- **What:** Movement speed varies per unit (and reacts to stats — haste, slows, ranged kiting),
  instead of one shared `MOVE_SPEED` constant.
- **Why deferred (M10):** there is no move-speed stat, and the overview leaves ranges / kiting to
  "tune live". A single constant is enough to prove the loop (closing distance, range checks).
  `approach`/`stepFor` already take the step as a parameter, so per-unit speed slots in later
  without engine changes.
- **Revisit trigger:** When a ranged class wants to keep its distance, or haste/slow effects land.
- **Related:** `MOVE_SPEED` in [src/domain/battle/tuning.ts](../src/domain/battle/tuning.ts).

### D-023 — Buff / debuff skills applied in-battle (charges, provoke)

- **What:** Auto-casting **buff** (raise-shield charges → `blockChance`) and **debuff** (provoke →
  reduced defense) skills _during_ a battle, so they change the target's `getStat` mid-fight.
- **Why deferred (M10):** M10 auto-casts only **damage / areaDamage** skills (smash, shatter),
  which need no stat mutation. Buff/debuff in-battle requires combatants to carry **dynamic
  modifier sources** (a `BuffTracker` / `ChargeTracker` folded into `getStat`) — characters can be
  built with them, but `Monster`/`TrainingDummy` have frozen stats — plus a clamp rework (provoke
  on a 0-defense monster currently clamps to no effect). The M8 resolvers (`resolveBuff`,
  `resolveDebuff`) already exist; only the in-battle wiring is deferred.
- **Revisit trigger:** When combatants gain dynamic modifier sources (or a battle-combatant
  wrapper) so timed/charge effects can alter stats during the fight.
- **Related:** `castSkills` in [src/domain/battle/battle.ts](../src/domain/battle/battle.ts);
  `resolveBuff`/`resolveDebuff` in [src/domain/skills/resolve-skill.ts](../src/domain/skills/resolve-skill.ts).

### D-024 — XP → level curve balancing

- **What:** The real experience curve that converts accumulated XP into character levels
  (per-level thresholds, pacing against the stage XP baselines and group sizes).
- **Why deferred (M11):** M11 ships `xpForKill` + `splitXpAmongLiving` (the actual deliverable —
  kills award XP split among the living) plus a **placeholder triangular** `xpRequiredForLevel`
  (`100 × (L−1) × L / 2`) so XP is usable. The numbers are not balanced against content yet.
- **Revisit trigger:** When leveling pace feels wrong against the 2-act content, or when an XP /
  level bar surfaces in the UI and the curve needs to feel right.
- **Related:** `xpRequiredForLevel` / `levelForTotalXp` in [src/domain/stages/xp.ts](../src/domain/stages/xp.ts).

### D-025 — Per-difficulty extra elements

- **What:** Letting a **difficulty** add damage elements on top of the act's set (overview hint:
  hard act 2 could deal physical + fire + **cold**).
- **Why deferred (M11):** the overview's v1 rule is _"for now, the only loot difference between
  difficulties is the item level."_ M11 sources elements purely from the act (`allowedElements`)
  and makes difficulty a flat item/monster-level bonus only, keeping act 1 strictly physical.
- **Revisit trigger:** When difficulties should feel mechanically distinct beyond item level —
  e.g. hard introducing a new element the player must resist.
- **Related:** `allowedElements` in [src/domain/stages/act-def.ts](../src/domain/stages/act-def.ts);
  `DifficultyDef` in [src/domain/stages/difficulty.ts](../src/domain/stages/difficulty.ts).

### D-017 — Paid-revive cost balancing

- **What:** The real gold price (and any scaling / caps / diminishing returns) for instantly
  reviving a downed member instead of waiting out its respawn timer.
- **Why deferred (M12):** M12 ships the respawn mechanic (`RespawnQueue`, the `Clock`-driven
  2-minute timer, flat+% reduction) and revive-all at stage start. The instant-revive hook
  exists as a **placeholder** `instantReviveCost(level) = 50 + 10 × (level − 1)` so the "spend
  gold to skip the wait" path is wired, but the numbers are not balanced against the economy.
- **Revisit trigger:** When gold (M13) and the revive flow surface in the UI and the price needs
  to feel meaningful against earnings, or when rune respawn-reduction perks (M18) interact with it.
- **Related:** `instantReviveCost` in [src/domain/revive/revive-cost.ts](../src/domain/revive/revive-cost.ts);
  `tuning.ts` constants in [src/domain/revive/tuning.ts](../src/domain/revive/tuning.ts).

### D-026 — Gold scaling / balance curve

- **What:** The real gold numbers — base values per source, how gold scales across stages/acts,
  and the per-source rune modifiers — so the overview's endgame anchors (a weak monster paying
  `1k` and a strong one `2k` _with all buffs_) actually land.
- **Why deferred (M13):** M13 ships `goldForKill(source, stageLevel, modifiers)` with exact early
  anchors (act 1-1 weak = `1`, stage boss = `10×`, strong = `2×` weak, act boss = `50`) and a
  simple **linear** stage scaling (`base × stageLevel`). The absolute endgame figures depend on
  rune buffs (M18) and the full stage spread, which don't exist yet, so the curve is a placeholder.
- **Revisit trigger:** When the rune tree (M18) supplies per-source gold modifiers and stages
  span the whole game, so the gold-per-minute economy can be tuned end to end.
- **Related:** `goldForKill` / `BASE_GOLD` in [src/domain/economy/gold.ts](../src/domain/economy/gold.ts).

### D-027 — Type-2/3 sockets & Immortal/Mythical rarities

- **What:** The overview's full socket table grants **type-2 (engraving)** and **type-3
  (inscription)** sockets to the higher rarities (Immortal: 2×type-1 + 1×type-2; Mythical adds a
  type-3). Those rarities are not in our 5-tier `Rarity` union yet.
- **Why deferred (M16):** M16 ships the socket machinery (`SOCKET_LAYOUT`, type-matching in
  `applyMaterial`) and tests type-2 rejection with a type-2 material, but no current rarity grants
  a type-2/3 socket. Adding empty rows would be dead data.
- **Revisit trigger:** When the `Rarity` union expands past `Legendary`; add the
  Immortal/Mythical rows to `SOCKET_LAYOUT` (data-only change).
- **Related:** `SOCKET_LAYOUT` in [src/domain/items/socket.ts](../src/domain/items/socket.ts).

### D-028 — Engraving 50/50 dual-stat roll

- **What:** Engraving materials in [material-effects.md](../docs/material-effects.md) roll **one of
  two** stats per slot (the doc's _(50% each)_ rows). M16 models a single stat per category.
- **Why deferred (M16):** The dual-stat coin-flip is depth on top of the working single-stat roll;
  `rollMaterial` already injects `Rng`, so adding a per-category stat **pair** + a pick is a
  contained extension.
- **Revisit trigger:** When engravings need to feel distinct from decorations beyond socket type.
- **Related:** `rollMaterial` / `MaterialDef.byCategory` in [src/domain/items/material.ts](../src/domain/items/material.ts).

### D-029 — Full material catalogue

- **What:** Encode the complete ~60-row gem table from [material-effects.md](../docs/material-effects.md)
  (all rarities, all categories, all tiers).
- **Why deferred (M16):** M16 ships a representative subset that exercises type-1/type-2 and
  flat/percentage rolls across all three categories. Transcribing the whole table is
  content/balancing work, not engine work.
- **Revisit trigger:** When the cube (M17) + drops surface real material variety to players.
- **Related:** `MATERIALS` in [src/domain/items/material.ts](../src/domain/items/material.ts).

### D-018 — Cube crafting / offering / decoration / engraving / inscription / extraction

- **What:** The cube operations beyond synthesis + alchemy: **crafting** (misc → equipment),
  **offering**, **decoration / engraving / inscription** (apply materials into M16 sockets via the
  cube) and **extraction** (remove a socketed material). Their unlock levels & gold costs are
  encoded as data (`CUBE_OPERATIONS`) so unlock-gating is testable, but the operations themselves
  do nothing yet.
- **Why deferred (M17):** M17 ships the three foundational pieces — synthesis (recycle), alchemy
  (sell), and cube leveling (EXP → level → unlocks). The remaining ops are content/depth that lean
  on the M16 socket machinery (`applyMaterial`/`extract`) and a material inventory; wiring them now
  would outrun the loot/material economy.
- **Revisit trigger:** When players have material variety (D-029) and want to socket/extract via the
  cube, or craft equipment from misc drops.
- **Related:** `CUBE_OPERATIONS` / `isOperationUnlocked` in [src/domain/cube/cube-exp.ts](../src/domain/cube/cube-exp.ts);
  `applyMaterial` / `extract` in [src/domain/items/socket.ts](../src/domain/items/socket.ts).

### D-030 — Cube gold/EXP weighting & curve tuning

- **What:** The finer cube economy knobs: the **material (×12) item-type** factor for EXP & gold,
  **per-gear-type alchemy gold** weighting (cube.md gives amulet ×4 … boots ×0.7 for EXP — gold
  reuses the same factors), a **fine-grained per-level** cube-EXP threshold curve (only cube.md's
  sparse anchors are encoded), and tuning of the `levelMatch` falloff.
- **Why deferred (M17):** M17 hits the overview/cube.md anchors exactly (L1 Common = 10g, L10
  Legendary = 6750g; Common L1 = 2 EXP, L5 = 20) with grade × level × gear-type × level-match. The
  remaining weightings are content/balance, not engine — gold currently ignores gear type, EXP
  treats every item as gear (×1), and `cubeLevelForExp` snaps to the nearest documented anchor.
- **Revisit trigger:** When materials become sellable/meltable, or the cube-leveling pace and
  per-slot melt values need balancing against the loot economy.
- **Related:** `sellValue` in [src/domain/cube/alchemy.ts](../src/domain/cube/alchemy.ts);
  `cubeExpForItem` / `cubeLevelForExp` in [src/domain/cube/cube-exp.ts](../src/domain/cube/cube-exp.ts).

### D-031 — Rune cost / value balancing

- **What:** Every tuning knob on the rune tree: per-node `baseCost`, `maxLevel`, `perLevel`
  value, and the global `RUNE_DEPTH_GROWTH` (1.5) cost multiplier. All current numbers are
  placeholders chosen only to satisfy the structural laws (cost strictly rises with depth and
  level).
- **Why deferred (M18):** M18 ships the rune _engine_ — the tree shape, the cost function shape,
  the stat `ModifierSource`, and the perk adapters. Picking real numbers needs a gold-income curve
  (which stage/source pays what over time) that does not exist yet.
- **Revisit trigger:** When a gold-income curve exists (post-economy balancing) and rune purchases
  need to feel paced against farming.
- **Related:** `RUNE_TREE` in [src/domain/runes/rune-tree.ts](../src/domain/runes/rune-tree.ts);
  `runeCostAt` / `RUNE_DEPTH_GROWTH` in [src/domain/runes/rune-node.ts](../src/domain/runes/rune-node.ts).

### D-032 — Rune tree UI reveal / adjacency graph

- **What:** The discovery graph — which nodes are visible/adjacent to a purchased node (overview:
  "unlocking one node, it will show the adjacent nodes"). The domain stores each node's `branch`
  and `depth`; it does **not** model parent/child edges, because purchases have no prerequisites.
- **Why deferred (M18):** Revealing nodes is pure presentation; gating purchases on it would
  contradict the overview's "no pre-requisites." The metadata needed to render the graph is
  present, but laying out and animating the tree is the outer shell's job.
- **Revisit trigger:** When the rune tree gets a UI screen.
- **Related:** `RuneNode.branch` / `RuneNode.depth` in [src/domain/runes/rune-node.ts](../src/domain/runes/rune-node.ts).

### D-033 — Wiring rune perks into systems that lack a hook today

- **What:** Three perk families are exposed by `RuneState` but not yet consumed: **XP** perks
  (`xpForKill` has no modifier param), the **slot** perks (`skillSlots` / `heroSlots` /
  `groupSlots` — no slot consumers until M19), and any **offline-window** perk (M21). The values
  are summable and tested now; their consumers adopt them when those systems gain the hook.
- **Why deferred (M18):** M18's named hooks (gold, drops, inventory cap, respawn, cube EXP) are
  wired end-to-end against the real functions. The remaining consumers either don't exist yet
  (slots → M19, offline → M21) or have no modifier parameter to thread through (`xpForKill`).
- **Revisit trigger:** M19 (slots), M21 (offline), or whenever `xpForKill` grows an exp-modifier
  parameter mirroring `goldForKill`.
- **Partially resolved (M19):** `heroSlots` / `groupSlots` are now consumed — `Roster` /
  `GroupRoster` take their capacity from `RuneState.heroSlots(base)` / `groupSlots(base)`. Still
  deferred: `skillSlots` (no skill-loadout cap consumer yet), `expPercent` (`xpForKill` has no
  modifier param), and the offline-window perk (M21).
- **Related:** `expPercent` / slot getters in [src/domain/runes/rune-state.ts](../src/domain/runes/rune-state.ts);
  `xpForKill` in [src/domain/stages/xp.ts](../src/domain/stages/xp.ts);
  `Roster` / `GroupRoster` in [src/domain/roster/](../src/domain/roster/).

### D-019 — Second currency + character / group shop

- **What:** Acquiring new characters and groups from a shop, paid with a dedicated, scarcer
  currency (overview: "new characters and groups are acquired later, not created freely … a
  dedicated, scarcer currency is spent to buy characters and groups"). M19 ships the **owned**
  collections (`Roster`, `GroupRoster`) and their slot caps, but they are populated directly
  (tests / default seed / UI) — there is no purchase flow or second currency.
- **Why deferred (M19):** the overview explicitly punts the shop and currency ("we will implement
  it later, no need to care about them now"). M19's job is the roster/group data model + formation
  that feeds battle; acquisition is an outer economy concern.
- **Revisit trigger:** when the game needs a progression sink for fielding more heroes/groups —
  i.e. when a second currency and a shop screen are designed.
- **Related:** `Roster` / `GroupRoster` in [src/domain/roster/](../src/domain/roster/);
  `Wallet` in [src/domain/economy/wallet.ts](../src/domain/economy/wallet.ts) (the first currency).

### D-034 — Per-group formation capacity value

- **What:** How many characters a single group may field. M19 caps it at
  `DEFAULT_FORMATION_CAPACITY = 5`, a placeholder chosen only to have a finite cap. Open: the real
  number, and whether formation size should derive from another source (a stat, a rune perk, or a
  per-group upgrade) rather than a flat constant.
- **Why deferred (M19):** the overview pins the _roster_ size (3 hero slots) and _group_ count
  (1 group slot) and says both are rune-expandable, but never fixes how many heroes fit in one
  group's formation. Picking that needs live battle tuning (front/back rank balance).
- **Revisit trigger:** when battles need a tuned formation size, or a rune/upgrade that grows it.
- **Related:** `DEFAULT_FORMATION_CAPACITY` / `Group` in [src/domain/roster/group.ts](../src/domain/roster/group.ts).

---

> _Last updated: keep this line current when appending — but never rewrite past entries._
