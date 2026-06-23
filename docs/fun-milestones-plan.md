# Fun Roadmap — Milestones M22–M31

> **Purpose.** Turn the working-but-invisible harness into a game that is **alive, legible, and
> idle**. Authored as a Senior Software Engineer plan over the existing domain (M1–M21). It follows
> the repo laws: **TDD**, **SOLID**, **DRY**, **reuse over rebuild**, **domain purity**, **inject
> `Clock`/`Rng`**, **compute-don't-store**, **data-not-code**, and **log every deferral** as `D-###`.
>
> **How to use this file.** Each milestone below is a **self-contained prompt** for a fresh chat
> instance — copy one `## Milestone …` section as the whole task. Do the milestones **in order**
> (later ones depend on earlier seams). **Stop at each `### ✋ Checkpoint`** for a human review +
> manual test before continuing.
>
> Read [game-overview.md](game-overview.md) for _what_ the game is,
> [game-implementation-roadmap.md](game-implementation-roadmap.md) for build status, and
> [ui-test-harness-plan.md](ui-test-harness-plan.md) §5 for the component inventory this plan draws on.

---

## Why these, in this order (Game-Designer rationale, condensed)

The three complaints — _can't see the battle_, _can't see what armor/attack do_, _not idle (keep
pressing buttons)_ — are the three pillars of idle-ARPG fun. All are missing for one reason:
`GameSession.playStage()` computes a whole stage **synchronously** and returns one line of text.
Everything needed to fix this is already built and tested in the domain; it is **surfacing**, not new
systems. The tiers from the design review map 1:1 to milestones:

| Tier                            | Milestones | Outcome                                        |
| ------------------------------- | ---------- | ---------------------------------------------- |
| **T1 — alive & idle**           | M22–M24    | You watch a self-running battle with feedback. |
| **T2 — choices become legible** | M25–M27    | Stats/gear/levels visibly matter.              |
| **T3 — the idle loop closes**   | M28–M29    | Close the app, come back richer.               |
| **T4 — polish & dopamine**      | M30–M31    | Skills, crits, loot juice.                     |

---

## 📊 Progress tracker (single source of truth)

> Update this table as the **first** thing when a milestone changes state. Mirrors the dashboard in
> [game-implementation-roadmap.md](game-implementation-roadmap.md). `Tests` = the milestone's
> acceptance tests are green under `npx vitest run`. Tick the per-step checkboxes inside each
> milestone section as you go; flip the row here when all of a milestone's steps pass.
>
> **Status legend:** ⬜ not started · 🟡 in progress · ✅ done · ⏸️ blocked · ⏭️ deferred.

**Current focus:** ⬜ **M22 — Live, ticking battle view** (keystone; start here).

| #   | Milestone                             | Tier | Status | Tests | Resolves / Logs             |
| --- | ------------------------------------- | ---- | ------ | ----- | --------------------------- |
| M22 | Live, ticking battle view             | T1   | ⬜     | ⬜    | part of D-016; D-042/043    |
| M23 | Auto-advance / auto-retry idle loop   | T1   | ⬜     | ⬜    | D-044                       |
| M24 | Floating damage numbers + combat feed | T1   | ⬜     | ⬜    | D-045                       |
| M25 | Derived-combat panel                  | T2   | ⬜     | ⬜    | D-046                       |
| M26 | Apply XP → real leveling from combat  | T2   | ⬜     | ⬜    | D-037; tail of D-008; D-047 |
| M27 | Build & gear impact preview           | T2   | ⬜     | ⬜    | D-048                       |
| M28 | Real persistence + autosave           | T3   | ⬜     | ⬜    | D-036; D-049                |
| M29 | "Welcome back" offline summary        | T3   | ⬜     | ⬜    | D-050                       |
| M30 | Skills visibly firing + cooldown bars | T4   | ⬜     | ⬜    | D-051                       |
| M31 | Loot juice + auto chest / auto-sell   | T4   | ⬜     | ⬜    | D-052                       |

> **Checkpoint gates:** stop for human review + manual test after **M24** (Checkpoint A), **M27**
> (Checkpoint B), **M29** (Checkpoint C), and **M31** (Checkpoint D).

---

## Shared foundations (introduced in M22, reused by M23/M24/M30/M31)

Three reusable seams are built **once** in M22 and depended on afterward. Building views before these
would duplicate ticking/began logic, so M22 is the keystone.

1. **`BattleEvents` sink (domain, observer pattern).** `Battle` currently calls `resolveAttack`
   (which already returns `AttackResult { damage, blocked, dodged, defeated, element }`) and **throws
   the result away**. Add an **optional injected** event sink so per-hit/skill/death facts can be
   observed **without** the domain knowing about the UI (DIP + Open/Closed). Default = a no-op sink,
   so existing behavior and determinism are unchanged.
2. **`BattleSession` controller (app layer).** A thin, steppable wrapper around `StageRunner` that the
   shell ticks frame-by-frame, and that **reuses the existing reward/progression logic** extracted
   from `playStage` (DRY). `playStage()` stays as the synchronous run-to-completion path (used by
   tests and offline) — both share one private `finishStage()`.
3. **`useClockLoop` hook (shell).** One `requestAnimationFrame` loop that calls `advance(deltaMs)` on
   whatever `Clock` it's given, gated by play/pause. The only place wall-clock time enters the app.

---

## Milestone M22 — Live, ticking battle view

> **Goal.** Replace the one-shot `playStage()` in the Battle screen with a **frame-by-frame battle**
> the player can watch: party (left) vs monsters (right), moving and fighting, with HP bars.
> **Tier 1. Depends on:** nothing (keystone). **Resolves:** part of [D-016]; the `Clock` loop from
> [ui-test-harness-plan.md](ui-test-harness-plan.md) §3.

### Reuse (do NOT rebuild)

- Domain: `StageRunner` (`implements Clock`, `advance/tick`, `.party`, `.currentBattle`,
  `.currentWaveIndex`, `.waveCount`, `.status`), `Battle` (`.party`, `.enemies`, `.status`),
  `BattleUnit` (`.x`, `.isAlive`, `.name`, `.side`, `.combatant.currentHP`, `.combatant.getStat`).
- App: `GameSession` (`buildStageWaves`, `buildRoster`, `buildGroupRoster`, `actByIndex`, `stageAt`
  are already imported there). The reward block at the end of `playStage` (gold/xp/chest/advance,
  retreat-on-wipe).
- UI: existing primitives `ProgressBar` (native `<progress>`), `Badge`, `Panel`, `Row`, `Stack`,
  `Button`; the `useAction()`/`run`/`version` seam in [GameStateProvider](../src/ui/state/GameStateProvider.tsx).

### Build

- **App layer — extract + control.** In [game-session.ts](../src/app/game-session.ts):
  - Extract the reward/progression tail of `playStage` into a private `finishStage(runner, stage,
difficulty): StageReport` (pure mapping over the finished runner). `playStage()` keeps its
    run-to-completion loop, then calls `finishStage` — **behavior identical**, just DRY.
  - Add `beginStage(): BattleSession` that builds the party + `StageRunner` (same as `playStage`) and
    returns a small controller exposing: `runner` (read-only, for rendering), `status`, `advance(ms)`,
    and `finish(): StageReport` (delegates to `finishStage`, applies rewards/progression **once**).
- **Shell — clock loop.** New `src/ui/state/useClockLoop.ts`: `useClockLoop({ clock, playing,
stepMs?, onTick? })` driving `requestAnimationFrame`; accumulates real `deltaMs` and calls
  `clock.advance(...)`. No domain import beyond the `Clock` type.
- **UI composites — the view** (specced in [ui-test-harness-plan.md](ui-test-harness-plan.md) §5.2,
  not yet built): `UnitCard` (one `BattleUnit`: name, HP `ProgressBar`, side/element `Badge`,
  dimmed when dead) and `BattleStrip` (lays party + enemies along the 1D line by `x`). Add CSS in
  [components.css](../src/ui/components.css).
- Wire `BattleScreen` to `beginStage()` + `useClockLoop` + `BattleStrip`, re-rendering on tick.

### Design notes (SOLID/DRY)

- **SRP:** `BattleSession` only orchestrates stepping + finishing; rendering lives in composites;
  rewards stay in the domain-facing `GameSession`. **DRY:** `finishStage` is the single reward path
  shared by `playStage` (sync) and `BattleSession` (stepped).
- **No inline styles / no raw HTML in screens** (harness rule). Positioning units by `x` needs a
  decision: prefer a constrained CSS custom property (e.g. `--x` on a `.battle-unit` class) or a few
  discrete lane classes. If a positional inline style is unavoidable, **log it as a deferral** and keep
  it to the one `BattleStrip` primitive only.

### TDD steps

1. **(red→green) `finishStage` extraction:** existing `game-session.test.ts` battle-loop tests must
   still pass unchanged after the refactor (they are the safety net). Add a test that `playStage()`
   and `beginStage()`-then-advance-to-completion-then-`finish()` yield the **same** `StageReport` for a
   fixed seed (proves the two paths agree).
2. **`beginStage` stepping:** a test advances a `BattleSession` in `stepMs` chunks and asserts
   `status` transitions `ongoing → cleared/wiped`, and that `finish()` mutates progression exactly
   once (calling it twice throws or is a no-op — pick one and test it).
3. `useClockLoop`: a small unit test (fake timer) that it calls `advance` while `playing` and stops
   when paused. (If rAF is awkward to test, isolate the accumulation logic into a pure helper and test
   that.)

### Acceptance criteria

- Pressing **Play** on the Battle screen shows units moving and HP bars draining in real time; the
  stage resolves to the same reward as before; `npx vitest run` green; lint green.

### Manual test

- `npm run dev` → Battle tab → Play → watch a stage play out; confirm rewards/log match prior behavior;
  confirm a wipe retreats one stage.

### Deferrals to log

- **D-042** — battle-view fidelity/juice (animation, art, easing, camera) — still part of D-016 scope.
- **D-043** (only if needed) — relaxing the no-inline-style rule for positional rendering in
  `BattleStrip`.

---

## Milestone M23 — Auto-advance / auto-retry idle loop

> **Goal.** Make it **idle**: one Play/Pause toggle; on clear, auto-start the next run; on wipe,
> retreat/retry per the design rules — no per-stage button pressing. **Tier 1. Depends on:** M22.

### Reuse

- M22's `BattleSession` + `useClockLoop`. Domain advance/retreat already encoded in
  `finishStage`/progression (`advance`/`retreat`). Stage-selection rules in
  [game-overview.md](game-overview.md) §"gameplay loop" (latest stage advances on clear / retreats on
  wipe; an earlier selected stage repeats; optional "retry").

### Build

- A small **app-layer policy**: when a `BattleSession` finishes, decide the next session (advance,
  repeat, or retry) from `progression` + a `retryOnWipe` flag. Put this where it can be unit-tested
  without React (e.g. a pure `nextStagePlan(progression, report, { retryOnWipe })`).
- Shell: a `BattleRunner` controller hook that chains sessions automatically while `playing`, exposing
  current session + a running log; Play/Pause + a "Retry on wipe" toggle in `BattleScreen`.

### Design notes

- **OCP:** the "what to do next" decision is one pure function; the loop just executes it. No rules in
  React.

### TDD steps

1. `nextStagePlan`: clear on latest stage → advance; clear on earlier-selected stage → repeat same;
   wipe + retry → same stage; wipe + no-retry → retreat (never below 1-1).
2. Chaining: a headless test drives N auto-runs from a seed and asserts the position walks as expected.

### Acceptance criteria

- Pressing Play once runs stage after stage hands-free; toggling pause stops cleanly; wipes follow the
  chosen retry/retreat rule. Tests + lint green.

### Manual test

- Battle tab → Play once → watch it clear several stages and advance without further clicks; flip
  "Retry on wipe" and force a wipe (low stage select on a weak hero) to see the difference.

### Deferrals to log

- **D-044** — auto-loop UX knobs (stop-at-stage, speed multiplier, "farm current stage" lock).

---

## Milestone M24 — Floating damage numbers + live combat feed

> **Goal.** Make **attack and armor visible**: show damage dealt/taken, **BLOCK**/**DODGE**, deaths,
> as floating text over `UnitCard`s and a scrolling combat feed. **Tier 1. Depends on:** M22.

### Reuse

- `resolveAttack` already returns `AttackResult { damage, blocked, dodged, defeated, element }`.
- Existing `LogList` primitive for the feed.

### Build

- **Domain seam (the foundation):** define `BattleEvents` (e.g. `onHit(e)`, `onSkill(e)`, `onDeath(e)`)
  as an **interface**; give `Battle` (and `StageRunner` pass-through) an **optional** sink, defaulting
  to a shared `NO_OP_EVENTS`. Emit from inside `basicAttack`/`castSkills`/on defeat using data already
  in hand. **Determinism unchanged** (events are emitted, never read, in the domain).
- **App layer:** `BattleSession` accepts/holds a buffering sink and exposes `drainEvents()` for the
  shell to pull each frame (keeps React out of the domain).
- **UI:** a `FloatingNumbers` layer over `BattleStrip` and a combat `LogList`. Reuse rarity/tone
  classes; new CSS for float-up/fade.

### Design notes

- **DIP/OCP:** the domain depends on the `BattleEvents` **abstraction**, not the UI. Adding M30's skill
  visuals later = just consuming more event types, no domain change. **This sink is the single source**
  for M24, M30, and the combat feed (DRY).

### TDD steps

1. (red) A `Battle` test with a **recording** sink asserts: a landed hit emits one `onHit` with the
   right `damage`/`element`; a blocked hit emits `blocked:true, damage:0`; a lethal hit emits
   `defeated:true` then `onDeath`. Order matches the locked tick order.
2. Default no-op sink: a `Battle` run **without** a sink behaves byte-identically to today (snapshot/seed
   test) — proves zero behavior change.
3. `BattleSession.drainEvents()` returns then clears the buffer.

### Acceptance criteria

- Watching a fight, numbers float on hits, blocks/dodges read clearly, deaths flash, the feed scrolls.
  A high-armor hero visibly takes smaller numbers / more blocks. Tests + lint green.

### Manual test

- Battle tab → Play → confirm numbers/blocks/deaths; equip a high-armor item (Inventory tab) and watch
  incoming numbers shrink.

### Deferrals to log

- **D-045** — combat-feed depth (crit tags once crits exist, mitigation breakdown tooltip, damage
  totals/DPS meter).

---

### ✋ Checkpoint A (after M24) — _the game is now watchable and idle_

Human review + manual play: Play once, watch several auto-runs with floating numbers; confirm
determinism unaffected (`npx vitest run` green), lint green, no domain→UI imports. Decide whether the
feel is good before investing in T2.

---

## Milestone M25 — Derived-combat panel (what stats DO)

> **Goal.** On the Character screen, show **combat outputs** so armor/attack are legible: DPS, hit
> damage, attacks/sec, physical resist %, effective HP, and est. time-to-kill a stage monster.
> **Tier 2. Depends on:** none (but most satisfying after T1).

### Reuse

- [derived.ts](../src/domain/combat/derived.ts): `physicalResist`, `timeBetweenAttacks`, `maxHP`;
  [damage.ts](../src/domain/combat/damage.ts): `hitDamageFromStats`/`computeHitDamage`. `GameSession`
  `statsOf(id)`. Existing `KeyValueList` primitive; `scaleMonster` for a reference dummy.

### Build

- **Pure derived helpers** (add to `derived.ts`, test-first) only for what's missing: `dps(getStat)`
  = hit damage × attacks/sec; `effectiveHP(getStat)` = `hp / (1 − physicalResist(armor))`;
  `timeToKill(attacker, defender)` in seconds. Compose existing functions — don't duplicate formulas.
- `DerivedStatList` composite (reads `statsOf`) rendered on `CharacterScreen` via `KeyValueList`.

### Design notes

- **DRY:** new helpers are thin compositions of existing ones; **SRP:** the composite only formats.

### TDD steps

1. `dps`/`effectiveHP`/`timeToKill` unit tests against worked numbers (e.g. starter `pd+5` L1:
   attack 10 × 5 × 1/s = 50 DPS; armor 10 → resist 100/110 anchor; EHP from that).
2. Composite render test (light): given a fake `statsOf`, rows show expected formatted values.

### Acceptance criteria

- Adding +armor visibly raises resist% and EHP; +attack visibly raises DPS, on screen. Tests + lint
  green.

### Manual test

- Character tab → note DPS/EHP → allocate an attack passive and an armor passive → values move.

### Deferrals to log

- **D-046** — TTK/DPS modeling depth (skills in DPS, multi-monster EHP, element resists in the panel).

---

## Milestone M26 — Apply XP → real leveling from combat

> **Goal.** Make kills actually **level the hero** and grant skill points, so progression is felt and
> the M25 numbers climb. **Tier 2. Depends on:** M25 (to see it). **Resolves:** [D-037]; closes the
> tail of [D-008].

### Reuse

- Level/XP curve in [character/level.ts](../src/domain/character/level.ts) (`xpRequiredForLevel` /
  level-from-xp — confirm exact names). `xpForKill` (already used in `playStage`). `SavedCharacter`
  recipe + `buildMember` rehydration. `skill-points.ts` (`availablePoints = level − spent`).

### Build

- Add a `totalXp` (or equivalent) field to `SavedCharacter` + a pure
  `levelForTotalXp(totalXp)`/`applyXp(character, xp)` in the domain (test-first), bumping `level`
  via the existing curve. **Bump `SAVE_VERSION`** and handle old saves (see D-035) — minimally, default
  missing `totalXp` from current `level`.
- App: `playStage`/`finishStage` (and `simulateOffline`) award `xp` to the **living** group members
  (overview rule), via the domain helper. Keep XP **split among living** as already specified.

### Design notes

- **Data-not-code:** leveling is a pure function of `totalXp` over the existing curve (compute-don't-store).
- **DRY:** one `applyXp` used by both stepped and offline paths.

### TDD steps

1. `levelForTotalXp`/`applyXp`: crossing a threshold raises level by the right amount and exposes the
   right `availablePoints`; partial XP doesn't level.
2. Serialize round-trips `totalXp`; deserializing an old save (no field) defaults sanely; version
   mismatch handling matches existing `deserialize` contract.
3. `finishStage` awards XP only to living members; a dead member earns none.

### Acceptance criteria

- Clearing stages raises hero level + skill points; refunds/allocations still work; saves load. Tests +
  lint green.

### Manual test

- Battle tab → auto-run a few clears → Character tab shows higher level + new skill points to spend.

### Deferrals to log

- **D-047** — XP curve/pacing balance against content (ties [D-024]); per-class XP later.

---

## Milestone M27 — Build & gear impact preview

> **Goal.** When equipping an item or allocating a passive, **preview the delta** (stat + derived:
> DPS/EHP/est. clear) so decisions are meaningful. **Tier 2. Depends on:** M25.

### Reuse

- M25 derived helpers; `GameSession.statsOf`; `buildMember` to compute a **hypothetical** character
  from a recipe variant (equip X / allocate Y) **without mutating** live state (compute-don't-store).
- Existing `EquipmentSlots`/`InventoryGrid`/`BuildAllocator`, `KeyValueList`, `Badge`.

### Build

- App-layer **read-only previews**: `previewEquip(charId, item)` / `previewAllocate(charId, node)`
  returning `{ before, after }` stat+derived snapshots by building a throwaway member (no side
  effects). (Reuses the rehydration pipeline; no new rules.)
- UI: a small delta display (▲green/▼red) reused on Inventory (equip) and Character (allocate).

### Design notes

- **CQS:** previews are pure queries; mutations stay in `equip`/`allocate`. **DRY:** one delta
  formatter.

### TDD steps

1. `previewEquip`/`previewAllocate`: `after − before` matches what an actual equip/allocate then
   `statsOf` would produce — but live state is **unchanged** afterward (assert no mutation).
2. Delta formatter: positive/negative/zero rendering.

### Acceptance criteria

- Hovering/selecting an item or a passive shows accurate before→after for stats and DPS/EHP without
  changing the character until confirmed. Tests + lint green.

### Manual test

- Inventory tab → generate an item → preview shows DPS/EHP change → equip and confirm it matches.

### Deferrals to log

- **D-048** — full side-by-side item compare / "is this an upgrade?" auto-badge.

---

### ✋ Checkpoint B (after M27) — _choices are now legible and rewarding_

Human review: confirm stats visibly matter (M25), leveling is felt (M26), gear decisions preview
correctly (M27). `npx vitest run` + lint green; saves still load.

---

## Milestone M28 — Real persistence + autosave

> **Goal.** Make "idle" real end-to-end: **autosave to storage** and record a **last-seen timestamp**
> so returning can compute offline progress. **Tier 3. Depends on:** M26 (save shape stable).
> **Resolves:** [D-036].

### Reuse

- [persistence](../src/persistence/): `serialize`/`deserialize`, `SAVE_VERSION`, `GameSession.save()`,
  `loadGame()`. `GameStateProvider` (single session owner) is the natural autosave host.

### Build

- A **storage adapter interface** (`SaveStore` with `load()/save()/clear()`) + a `localStorage`
  implementation (and an in-memory one for tests) — DIP so the shell/tests don't bind to `localStorage`.
- Persist a `savedAt` timestamp alongside the `SaveState` (wrapper DTO), so offline elapsed = `now −
savedAt`.
- Autosave cadence in the shell: debounced on mutation (`version` bump) + on key events; load on boot.

### Design notes

- **DIP:** domain/app never import `localStorage`; the adapter is injected at the shell edge (where
  wall-clock + storage already live).

### TDD steps

1. In-memory `SaveStore`: `save` then `load` round-trips a `GameSession` (reuse serialize tests).
2. Timestamp wrapper persists/reads `savedAt`; corrupt/empty store → null (fresh game), not a crash.
3. Autosave debounce logic (pure part) coalesces rapid mutations into one save.

### Acceptance criteria

- Reload the browser → game state persists (gold, level, position, inventory). Tests + lint green.

### Manual test

- Play, earn gold/levels → refresh the page → state is exactly as left.

### Deferrals to log

- **D-049** — autosave cadence/perf tuning, multi-slot saves, export/import file, cloud (extends
  [D-035] migrations when `SAVE_VERSION` bumps).

---

## Milestone M29 — "Welcome back" offline summary

> **Goal.** On load, compute what happened while away and show a **rewards summary**. **Tier 3.
> Depends on:** M28 (timestamp) + existing `simulateOffline`.

### Reuse

- `GameSession.simulateOffline(deltaMs)` and `OfflineReport { elapsedMs, stagesCleared, gold, xp,
items, itemsLost }` (already built, M21). M28's `savedAt`. A `Modal` primitive (build if missing) +
  `KeyValueList`/`Badge`.

### Build

- Shell boot flow: if `savedAt` exists, `elapsed = clamp(now − savedAt)`, call `simulateOffline`, then
  show a **Welcome-back `Modal`** summarizing the `OfflineReport` (including `itemsLost` as a nudge to
  expand bags/runes). Then autosave (M28) with a fresh timestamp.
- Build the `Modal` primitive if it doesn't exist yet (specced in
  [ui-test-harness-plan.md](ui-test-harness-plan.md) §5.1).

### Design notes

- **Reuse, don't re-simulate:** all idle math is already in `simulateOffline`; this milestone only
  triggers it on boot and renders the report.

### TDD steps

1. Boot flow (headless): given a `savedAt` N hours ago + seed, the banked gold/items match a direct
   `simulateOffline(N hours)` call (proves no parallel logic).
2. No `savedAt` (first run) → no modal, no banking.
3. Modal render: report fields map to rows; `itemsLost > 0` shows the warning tone.

### Acceptance criteria

- Closing/reopening after time passes shows a correct welcome-back summary and banks the rewards once.
  Tests + lint green.

### Manual test

- Play, refresh; to simulate hours, temporarily backdate `savedAt` (dev) and reload → summary appears
  with sensible numbers.

### Deferrals to log

- **D-050** — offline-window rune perk wiring + "claim/collect" animation (ties [D-038]).

---

### ✋ Checkpoint C (after M29) — _the idle loop is closed_

Human review: refresh persists; returning after time banks offline rewards with a summary. Confirm no
double-banking, determinism intact, lint + tests green.

---

## Milestone M30 — Skills visibly firing + cooldown bars

> **Goal.** Surface the built-but-invisible knight skills: show smash/shatter/raise-shield/provoke
> **triggering** in battle with **cooldown bars**. **Tier 4. Depends on:** M22 + M24 (event sink).

### Reuse

- `BattleEvents` from M24 (add/emit `onSkill`). `CooldownTracker` on `BattleUnit` (`cooldowns`), skill
  defs (M8: `KNIGHT_SKILL_NODES`, `resolveSkillDamage`). `ProgressBar` primitive; `SkillBar` composite
  (specced §5.2, build it).

### Build

- Emit `onSkill { casterId, skillId, rank, targets, damage }` from `Battle.castSkills` via the M24 sink
  (no new domain coupling).
- UI: skill-cast flash on `BattleStrip` + a `SkillBar` showing each skill's cooldown `ProgressBar` and
  rank, fed by `cooldowns` state drained per frame.

### TDD steps

1. Recording-sink test: an in-range ready skill emits exactly one `onSkill` with correct rank/targets;
   on cooldown it does not. (Extends M24's event tests; reuses the seam.)
2. `SkillBar` render: cooldown fraction → bar value.

### Acceptance criteria

- Watching a fight, skills visibly fire (e.g. a 400% Smash spike in the feed) and cooldown bars fill/empty.
  Tests + lint green.

### Manual test

- Character tab → rank up Smash → Battle tab → see it fire and the feed show the big hit.

### Deferrals to log

- **D-051** — buff/debuff in-battle visuals (raise-shield charges, provoke debuff icon) — ties
  [D-023]; skill VFX juice ties [D-016].

---

## Milestone M31 — Loot juice + auto chest / auto-sell

> **Goal.** Make drops feel good and cut clicks: rarity-flaired **drop feed**, satisfying chest open,
> and **auto-open / auto-sell-trash** toggles. **Tier 4. Depends on:** M22–M24 (feed) + cube (M17).

### Reuse

- Chest/drop flow (`openChest`, `firstChest`, `pendingChests`), cube `sellValue`/`synthesize`
  (M17), rune `dropChanceBonus`. Existing `ItemChip`/`Badge` rarity classes; combat/drop `LogList`.

### Build

- A **drop feed** entry on each chest/item with rarity tone + a small "pop" on Rare+.
- App-layer **auto-handlers** (pure policy + toggle): `autoOpenChests` (open while bag has space) and
  `autoSellBelow(rarity)` (route trash through cube `sellValue`). Headless-testable policies; toggles
  in the UI.

### Design notes

- **OCP:** auto-handlers are policies the loop calls; no change to chest/cube internals. **DRY:** selling
  reuses cube `sellValue`, not a new price path.

### TDD steps

1. `autoOpenChests`: opens up to free slots, stops when full (no throw), deterministic under seed.
2. `autoSellBelow`: sells only items strictly below the threshold rarity; gold matches `sellValue`.

### Acceptance criteria

- Drops show with rarity flair; toggling auto-open/auto-sell reduces manual clicks and behaves per the
  rules. Tests + lint green.

### Manual test

- Battle tab → auto-run with auto-open + auto-sell-common on → watch the feed and gold rise hands-free;
  confirm bag doesn't overflow silently.

### Deferrals to log

- **D-052** — loot filters / configurable auto-sell rules, drop-rarity animation polish (ties [D-016]).

---

### ✋ Checkpoint D (after M31) — _polish & dopamine in place_

Final review of the fun arc end-to-end: watchable auto-battle with damage numbers and skills, legible
stats/leveling/gear previews, real persistence + welcome-back, satisfying loot. `npx vitest run` +
lint green; domain purity intact (no `src/domain` → UI/persistence import).

---

## Cross-cutting reminders for every milestone prompt

- **TDD always:** failing test → minimal code → refactor. Never add production code without a test
  driving it.
- **Reuse first:** before writing anything, search for an existing symbol/primitive/composite that
  already does it (see the per-milestone _Reuse_ lists). Prefer composing existing pure functions.
- **Domain purity:** `src/domain/**` must not import React/DOM/persistence/app. Time + randomness +
  storage enter only at the shell edge (`GameStateProvider`, `useClockLoop`, `SaveStore`).
- **Log deferrals:** append new `D-###` rows to
  [deferred-decisions-log.md](deferred-decisions-log.md) (index + detailed entry + footer) — never edit
  past entries except `Status`.
- **Definition of done per milestone:** new tests + full suite green (`npx vitest run`), lint/build
  green, manual test performed, deferrals logged, and a one-paragraph summary of what changed.
  </content>
  </invoke>
