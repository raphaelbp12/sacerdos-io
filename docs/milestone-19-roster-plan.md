# Milestone 19 — Groups & character roster

> **Goal (from the roadmap).** Multiple owned characters and one or more **groups**, where a
> group is an **ordered formation** the player arranges. The formation order feeds M10's
> battlefield: formation index 0 is the front line. The number of characters the player may own
> (**hero slots**) and the number of groups (**group slots**) are capacities that default low and
> grow via the rune tree (M18 → resolves part of D-033). Acquiring characters/groups (the shop &
> its currency) stays **deferred** (D-019).
>
> Specs: [game-overview.md](game-overview.md) §"groups" (1 group + 1 character by default; 3
> chars / 1 group default, both expandable; "one inventory for characters" and "one inventory for
> groups"), §"battle" ("the group will have a linear formation, the player chooses which is the
> character order").

All new code lives under `src/domain/roster/` and obeys the architecture laws: pure (no
DOM/React/Vite), **compute-don't-store**, **data-not-code**, **one-way deps** (`roster → combat`

- `roster → battle`; nothing inner imports roster; roster never imports `runes` — slot capacities
  are passed in as plain numbers so the caller wires `RuneState.heroSlots/groupSlots`, keeping
  roster decoupled). TDD: failing test first, minimal pass, refactor.

## Locked design decisions (I decided the open ones)

- **A roster member is the minimal bundle needed to field a unit.** `RosterMember = { id,
combatant, skills?, attackElement? }` — exactly the inputs a `BattleUnit` needs. The roster
  owns identity (`id`) + the live `Combatant`; positions/timers stay in `BattleUnit` (the roster
  never stores battle state). This keeps roster decoupled from how a `Character` is composed.
- **Two capacities, two collections.** `Roster` caps **owned characters** (hero slots, default
  `DEFAULT_HERO_SLOTS = 3`). `GroupRoster` caps **owned groups** (group slots, default
  `DEFAULT_GROUP_SLOTS = 1`). A `Group` additionally caps its **formation size**
  (`DEFAULT_FORMATION_CAPACITY = 5`, a placeholder pending live tuning → D-034).
- **Capacities are plain numbers, injected.** Constructors take a capacity; the caller computes
  `runeState.heroSlots(DEFAULT_HERO_SLOTS)` / `runeState.groupSlots(DEFAULT_GROUP_SLOTS)`. Roster
  imports neither `runes` nor `stats` perks — one-way deps preserved; runes stays an outer wiring
  concern (mirrors how M18 adapters return plain shapes).
- **Formation is an ordered list of member ids, front-to-back.** `Group.add` appends to the back;
  `Group.move(id, toIndex)` reorders. `buildParty(roster)` maps the formation, in order, to
  `BattleUnit`s on the `"party"` side with a placeholder `x = 0` — **`StageRunner.spawnWave`
  already assigns each unit `x = PARTY_START_X + i × UNIT_SPACING` by index**, so formation order
  becomes battlefield order with no new positioning code (DRY).
- **Add operations are total + non-throwing.** `add` returns `false` (no mutation) on a full
  capacity or duplicate id, mirroring M15's `Inventory.add` boolean contract. `remove` returns
  whether something was removed.

## Steps

- [x] **19.1** `roster.ts`: `RosterMember`, `Roster` (hero-slot capacity), `DEFAULT_HERO_SLOTS`.
      _Test:_ add/remove/get/has; capacity blocks the (cap+1)-th distinct member; duplicate id
      rejected.
- [x] **19.2** `group.ts`: `Group` (ordered formation, formation capacity) + `GroupRoster`
      (group-slot capacity), `DEFAULT_GROUP_SLOTS`, `DEFAULT_FORMATION_CAPACITY`. _Test:_ formation
      order drives battle positions (front = index 0 = min x after `StageRunner` spawns);
      `move` reorders; formation cap + group cap enforced.
- [x] **19.3** Slot caps read `RuneState`. _Test:_ buying a hero-slot rune raises `Roster`
      capacity (`new Roster(runeState.heroSlots(DEFAULT_HERO_SLOTS))`); buying a group-slot rune
      raises `GroupRoster` capacity.
- [x] **19.4** `index.ts` barrel; full suite + typecheck + lint + build green.

## Deferrals to log

- **D-019** (pre-registered): second currency + character/group **shop** — acquisition is out of
  scope; the roster/group collections exist but are populated directly in tests/UI for now.
- **D-034** (new): per-group **formation capacity** value (`DEFAULT_FORMATION_CAPACITY = 5`) and
  whether formation size should derive from another stat/rune — placeholder pending live tuning.
