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

| ID    | Title                             | Deferred in | Status   | Revisit trigger (short)                             |
| ----- | --------------------------------- | ----------- | -------- | --------------------------------------------------- |
| D-001 | Affix system (prefixes/suffixes)  | M5          | Deferred | After combat makes loot quality matter              |
| D-002 | Modifier value _ranges_ (min–max) | M5          | Deferred | Alongside the affix system                          |
| D-003 | Multiple modifiers per item       | M5          | Deferred | With affixes; count scales with rarity              |
| D-004 | Named / unique items & crafting   | M5          | Deferred | After affixes; needs a baseline of item depth       |
| D-005 | Drop tables / loot sources        | M5          | Deferred | When combat/enemies exist to drop loot              |
| D-006 | Consumable generation             | M5          | Deferred | When consumables need variety beyond seed set       |
| D-007 | Persistence (save / load)         | M5          | Deferred | When losing state between sessions becomes painful  |
| D-008 | XP / leveling system              | pre-M6      | Deferred | When the player needs to _earn_ higher itemLevel    |
| D-009 | Enemy / monster system            | pre-M6      | Deferred | Folded into M6 as a minimal "training dummy"        |
| D-010 | Stat cache / memoization          | M1          | Deferred | Only if profiling shows getStat() is a hotspot      |
| D-011 | Skills as class-gated buffs       | M3          | Deferred | When a class system or skill UI is wanted           |
| D-012 | Advanced on-hit effects           | M6          | Deferred | When gear/skills need regen, leech, per-hit effects |
| D-013 | Additional classes beyond Knight  | M7          | Deferred | When a second class / class-select UI is wanted     |
| D-020 | Respec cost / cooldown            | M7          | Deferred | If free refunds make builds feel weightless         |

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

### D-003 — Multiple modifiers per item

- **What:** Items carry several modifiers, with the **count scaling by rarity** (Common 1,
  Legendary 4–6), as PoE/Diablo do.
- **Why deferred (M5):** Hard-coded to one modifier in `generateItem`. Multi-modifier rolls
  only feel good once each modifier is a meaningful affix (D-001) and there's a reason to
  weigh trade-offs (combat).
- **Revisit trigger:** Implement with D-001/D-002 as one "loot depth" milestone.

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

### D-020 — Respec cost / cooldown

- **What:** A price (gold, a currency, or a time cooldown) for refunding and re-spending skill
  points, instead of the current free, instant re-spec.
- **Why deferred (M7):** the overview explicitly wants free refunds in v1 ("points can be
  refunded at any time") to encourage experimentation. `Build.refund` is a pure operation, so a
  cost layer can wrap it later without touching the allocation rules.
- **Revisit trigger:** If economy tuning (M13) or balance shows free re-spec trivializes builds.
- **Related:** `Build.refund` in [src/domain/character/skill-points.ts](../src/domain/character/skill-points.ts).

---

> _Last updated: keep this line current when appending — but never rewrite past entries._
