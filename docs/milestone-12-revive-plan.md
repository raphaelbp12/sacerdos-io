# Milestone 12 Plan — Death & revive

> **Goal:** what happens when a group member's HP hits 0. A downed member sits out behind a
> **Clock-driven respawn timer** (base **2 minutes**, reducible by **flat + %** so future rune
> perks can shorten it), and the whole group is **revived at stage start**. A placeholder
> **paid instant-revive** cost makes the "spend gold to skip the wait" hook exist now; the
> actual pricing is **deferred** (D-017).
>
> **Headline acceptance test:** a downed member's respawn timer **counts down via `advance`**
> and the member **returns to full HP at 0**; a flat+% reduction shortens that wait; entering a
> stage **restores the whole group** (dead and merely hurt members both back to full); the
> instant-revive cost is a deterministic placeholder.

---

## 0. Decisions (made up-front, no blocking questions)

1. **New pure module `src/domain/revive/`.** Dependencies point inward only: `revive → clock`
   (it `implements Clock`). It does **not** import `stats`, `combat`, or `battle`; it works
   against a minimal **`Revivable` contract** so any HP-holder (a `Character`) plugs in without
   coupling (depend on contracts, not concretes). Nothing inner imports `revive` (no cycle).
2. **`Revivable` is the seam.** `{ readonly currentHP: number; revive(): void }`. "Downed" is
   derived (`currentHP <= 0`), consistent with `isAlive = currentHP > 0` everywhere else.
   `revive()` restores the holder to full HP. **Monsters do not revive** (they are enemies);
   revive is a player-group concern, so only `Character` gains a `revive()` method.
3. **Timer reduction mirrors `effectiveCooldown` (DRY).** `effectiveRespawnMs({flatMs, percent})`
   = `(BASE − flatMs) × (1 − percent)`, floored at `0`. Flat first, then percent — same order
   as the stat engine. Base lives in `tuning.ts` as `BASE_RESPAWN_MS = 120_000`.
4. **`RespawnQueue implements Clock` owns the only deliberately-stateful bit.** It tracks each
   downed unit's `remainingMs`; `advance(deltaMs)` decrements and, at `≤ 0`, calls `revive()`
   and dequeues. `down(unit, reduction?)` is idempotent (a unit already queued is not
   re-queued). Resolution (deciding a unit died) stays in the battle layer; M12 only models the
   wait, mirroring how `CooldownTracker` is separate from skill resolution (SRP).
5. **Revive-all at stage start full-restores everyone.** `reviveAll(members)` revives **all**
   members (dead → alive, hurt → full) — "entering a stage restores the group".
6. **Instant revive is a placeholder.** `instantReviveCost(level)` = a simple
   `base + perLevel × (level − 1)` gold formula. Real pricing/balancing is **deferred** (D-017).

---

## 1. Design

- **`tuning.ts`** — `BASE_RESPAWN_MS` (120 000), `MIN_RESPAWN_MS` (0), and instant-revive
  placeholder constants (`INSTANT_REVIVE_BASE_COST`, `INSTANT_REVIVE_COST_PER_LEVEL`).
- **`respawn.ts`** — `Revivable` contract; `isDowned`; `RespawnReduction`;
  `effectiveRespawnMs`; `RespawnQueue implements Clock` (`down` / `isPending` / `remainingFor`
  / `pendingCount` / `advance`).
- **`revive-all.ts`** — `reviveAll(members)`.
- **`revive-cost.ts`** — `instantReviveCost(level)` placeholder (D-017).
- **`index.ts`** — public barrel.
- Plus a one-line addition to `Character`: a `revive()` method (restore `currentHP` to `maxHP`)
  so the real group type satisfies `Revivable`.

## 2. Steps (TDD order)

- [x] **12.1 respawn timer** — `effectiveRespawnMs` anchors (no reduction → 120 000; flat 20 000
      → 100 000; 50 % → 60 000; both → 50 000; over-reduction floors at 0). `RespawnQueue`:
      `down` a unit → pending; `advance` below the timer keeps it downed; `advance` to the timer
      revives it (full HP) and clears it; reduction shortens the wait; double-`down` is idempotent.
- [x] **12.2 revive-all at stage start** — `Character.revive()` restores to full HP;
      `reviveAll` brings a group (dead + hurt members) all back to full.
- [x] **12.3 paid instant-revive placeholder** — `instantReviveCost(level)` deterministic
      anchors (L1, L10); rejects non-positive / non-integer levels. Log **D-017**.

## 3. Out of scope (deferred)

- **D-017** — paid-revive **cost balancing** (the formula here is a placeholder).
- Wiring the queue into `Battle` / `StageRunner` (who decides a unit died, and revival on stage
  entry in the runner) is a later integration concern; M12 ships the pure mechanic + contract.
