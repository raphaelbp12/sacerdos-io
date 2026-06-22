# Milestone 20 — Persistence (save / load)

> **Goal (from the roadmap).** Serialize the durable player state — roster + groups, equipment,
> inventory / stash, wallet, runes, cube level, progression — to a plain, JSON-safe **save
> object** and reconstruct the live domain from it. The mapper lives in the **outer layer**
> (`src/persistence/`, not `src/domain/`) so the domain stays pure — it depends inward on the
> domain barrels and never the reverse. Resolves **D-007**.
>
> Spec: [game-implementation-roadmap.md](game-implementation-roadmap.md) §M20 — "serialize.ts
> mapper (outer layer): pure DTO ↔ domain. Test: round-trip equality of a populated state."

All new code lives under `src/persistence/` and obeys the architecture laws relevant to an outer
module: **one-way deps** (`persistence → domain`; nothing in `domain` imports `persistence`),
**data-not-code**, and **compute-don't-store** (the save holds recipes; live combatants are
rebuilt on read). TDD: failing test first, minimal pass, refactor.

## Locked design decisions (I decided the open ones)

- **The save is the source of truth; combatants are computed.** A character persists as a
  **recipe** — `SavedCharacter = { id, name, classId, level, build, equipment, skills?,
attackElement? }` — never as a live `Combatant`. On load, `buildMember` rehydrates it through
  the existing `createCharacter` + `Equipment.equip` + `asCombatant` pipeline (compute-don't-
  store, DRY). This sidesteps trying to read a recipe back out of an opaque `Combatant`.
- **Items are already DTOs.** The `Item` interface (and its `modifiers` / `sockets` /
  `instantEffects` / `buff`) is pure data, so inventory / stash / equipment serialize by copying
  the item objects — no per-field item mapper (DRY).
- **`Infinity` capacity ↔ `null`.** `Inventory`'s default capacity is `Infinity`, which is not
  JSON-representable. Capacities encode as `number | null` (`null` = unlimited) and decode back.
- **Skills persist as `{ id, rank }`**, not the full `SkillDef`, and rehydrate via `skillById`
  (data-not-code — the heavy def stays in the registry).
- **Runes persist as a sparse `levels` record** (`nodeId → level`, zeros omitted) and rehydrate by
  replaying `RuneState.buy` (the only public mutator). `Build` persists the same way (`nodeId →
ranks`, replayed via `Build.spend`).
- **A `version` field gates loads.** `deserialize` rejects an unknown `version` so future format
  changes fail loudly rather than corrupting state.
- **`GameState` is the live aggregate** the shell owns: `{ progression, wallet, runes, cubeLevel,
inventory, stash, characters, groups, heroSlots, groupSlots }`. `serialize` maps it to a
  `SaveState`; `deserialize` maps back. `buildRoster` / `buildGroupRoster` turn the persisted
  recipes into the live `Roster` / `GroupRoster` of combatants for battle.

## Steps

- [x] **20.1** `save-state.ts`: the `SaveState` DTO tree + `SAVE_VERSION` + `GameState` /
      `SavedCharacter` / `SavedGroup` / `ProgressionState` domain-side shapes. _Test:_ shapes
      compile; `SAVE_VERSION` is a positive integer.
- [x] **20.2** `serialize.ts` — `serialize(state) → SaveState`: progression, wallet balance,
      sparse rune levels, cube level, inventory (capacity ↔ null + items), stash tabs, character
      recipes, group formations, slot caps. _Test:_ a populated state serializes to a JSON-safe,
      `Infinity`-free object.
- [x] **20.3** `serialize.ts` — `deserialize(save) → GameState`: rebuild `Wallet`, `RuneState`
      (replay `buy`), `Inventory`/`Stash` (replay `add`), copy recipes; reject unknown `version`.
      _Test:_ **round-trip** — `serialize(deserialize(JSON.parse(JSON.stringify(serialize(state)))))`
      deep-equals `serialize(state)`; rebuilt `Wallet.balance` / `RuneState.levelOf` /
      `Inventory.items` match; bad version throws.
- [x] **20.4** `serialize.ts` — `buildRoster(state)` / `buildGroupRoster(state)`: rehydrate live
      combatants + formations from recipes. _Test:_ a rebuilt member's `getStat("hp")` equals the
      original's (class + level + build + equipment all flow through); formation order preserved.
- [x] **20.5** `index.ts` barrel; full suite + typecheck + lint + build green; update tracker,
      flip D-007, append session log + memory.

## Deferrals to log

- **D-035** — Save migrations across `SAVE_VERSION` bumps (only v1 read today; no upgrader yet).
- **D-036** — Where the save physically lives (localStorage / file / cloud) and autosave cadence
  — persistence here is the pure mapper only; the storage adapter is the shell's job.
