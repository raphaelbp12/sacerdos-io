# Milestone 21 — Idle / offline progress

> See [game-implementation-roadmap.md](game-implementation-roadmap.md) §M21. Goal: on return,
> compute elapsed real time and **fast-forward farming on the current stage via the same
> `Clock`/battle tick** — no parallel simulation (DRY). Batch kills into gold + xp + chest rolls,
> capped by inventory space and an offline ceiling; deterministic under a fixed elapsed time + seed.

## Where it lives (decision)

`src/offline/` — an **outer-layer** module (sibling to `src/persistence/`), _not_ `src/domain/`.
Rationale: offline orchestrates over the whole **`GameState`** aggregate (defined in the M20
persistence layer), so it must depend on persistence + domain. Keeping it outside the domain
preserves domain purity (one-way deps: `offline → persistence → domain`). Randomness is still
**injected** (`Rng` parameter) — no `Math.random()`.

## Design

`simulateElapsed(state, deltaMs, rng, options?) → OfflineReport` is **pure** (no mutation of
`state`). It:

1. Caps elapsed time: `min(max(0, deltaMs), ceilingMs)` (default 8 h).
2. Resolves the active stage from `state.progression` (`actByIndex` / `stageAt`) and the active
   group (first owned group).
3. Loops: rebuild a **fresh full-HP party** from the recipes each stage (`buildRoster` +
   `group.buildParty` — reuses M20 rehydration = "revive-all at stage start", DRY), runs a
   `StageRunner` (the **real** M10 battle tick) in fixed `tickStepMs` steps until `cleared`,
   `wiped`, or out of time.
4. On each `cleared` stage: award gold (`goldForKill`, rune-modified), xp (`xpForKill`), and roll
   one chest item (`rollDrop`). A `wiped` stage or a partial (time-out) stage yields nothing and
   ends the run.
5. Caps kept items to the inventory's free slots; the overflow is counted as `itemsLost` (rolls
   still advance the rng so rewards stay deterministic).

`OfflineReport = { elapsedMs, stagesCleared, gold, xp, items, itemsLost }`. The shell applies it
(`wallet.add(gold)`, `inventory.add(item)…`). XP is **reported only** — there is no per-character
xp accumulator in the save format yet (D-037).

## Steps

- [x] **21.1** `offline.ts` + `simulateElapsed`, test-first: deterministic rewards for a fixed
      elapsed time + seed; `stagesCleared`/`gold`/`xp` scale with the time given; `items` capped by
      inventory free space with the overflow counted; zero elapsed / empty group → empty report;
      ceiling clamps very large `deltaMs`.

## Deferrals to log

- **D-037** — applying offline XP to characters (no `totalXp` field on `SavedCharacter`; xp is only
  reported for now).
- **D-038** — offline fidelity / batching: fixed-step ticking approximates movement; a closed-form
  "kills per second" fast path and an offline-window rune perk are future tuning.
