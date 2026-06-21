# Milestone 10 Plan — Battle engine (1D auto-battler)

> **Goal:** the core game loop. A `Clock`-driven `tick(deltaMs)` advances a **one-dimensional**
> battlefield: a party of characters and waves of monsters approach each other on a line,
> **focus-fire the front-most enemy**, auto-attack on their attack-speed cadence, auto-cast
> their damage skills when ready and in range, and the encounter ends when one side is wiped.
> A `StageRunner` feeds sequential waves into a persistent party, ending with the stage boss.
> Everything is **pure domain** (zero React/DOM), deterministic under an injected `Clock` + `Rng`.
>
> **Headline acceptance tests:**
>
> 1. A melee unit closes the full distance; a longer-ranged unit stops at its range (battlefield).
> 2. A scripted seed produces an identical blow-by-blow; a party clears a 1-monster wave; a party
>    wipes against an overtuned monster.
> 3. A `StageRunner` runs N waves and then the boss; the same script always yields the same number
>    of monsters (fixed reward, per the overview).

---

## 0. Confirmed decisions (made autonomously — user away; recorded here + as deferrals)

1. **Geometry.** A single numeric axis, `x` increasing to the right. The **party** advances toward
   **−x** (left); **enemies** spawn off the left and advance toward **+x** (right) — they converge
   (overview: "characters move to the left… monsters… move to the right"). A side's **front-most**
   unit is the one furthest along its advance direction (party = min `x`, enemy = max `x`). A unit
   that closes distance stops `range` short of its target — a monster never passes through a
   character because each front stops at the other's range. Allies **overlap freely** (overview:
   "the knight will pass through the ranger… the formation will change").
2. **Targeting.** **Front-to-back focus fire:** every unit targets the **opposing front-most
   living** unit; when it dies, the next front-most is targeted on the following tick.
3. **Movement speed.** No move-speed stat exists. M10 uses one shared tuning constant
   `MOVE_SPEED` (units/sec). Per-unit / stat-driven speed is **deferred → D-022**.
4. **Ranges.** Skill ranges are deferred ("tune live", **D-015**). M10 uses placeholder tuning
   constants: basic/melee/short ≈ 10, area ≈ 30, long ≈ 100. A unit's **engagement range** (its
   movement stop distance) is its basic-attack range, so it still closes to melee and uses
   longer-range skills en route.
5. **Skills in the loop.** Party units auto-cast their **damage / areaDamage** skills (smash,
   shatter) when the skill is off cooldown and the target is in range (areaDamage fans out to all
   enemies within its radius — the multi-target fan-out M8 deferred to M10). **Buff / debuff**
   skills (raise-shield, provoke) are **not** auto-applied in-battle yet: that needs combatants to
   carry **dynamic modifier sources** (so a charge buff / provoke debuff changes `getStat` mid
   fight) plus a clamp rework, which is out of scope for the loop. **Deferred → D-023.**
6. **Enemies are basic-attackers.** Monsters have no skill loadout (enemy skill-casting is
   **D-014**); they only basic-attack.
7. **Waves are data, not a schema.** The `StageRunner` takes pre-built `Monster[]` **waves** (the
   boss is just the final single-monster wave). It does **not** define a stage/act schema — that is
   **M11**'s job (`stage-def.ts` will _produce_ these waves). Keeps M10 decoupled (DRY). Party HP
   **persists** across waves within a stage; mid-stage revive / respawn timers are **M12**.

---

## 1. Design

- **Module home:** new pure module `src/domain/battle/`. Dependencies point inward only:
  `battle → combat` (`resolveAttack`, `Combatant`), `battle → skills` (`resolveSkillDamage`,
  `CooldownTracker`, `SkillDef`), `battle → monsters`, `battle → {clock, rng, stats}`. Nothing
  inner imports `battle` (no cycle).
- **`tuning.ts`** — all battle tuning constants in one documented place (mirrors `derived.ts`):
  `MOVE_SPEED`, `BASIC_ATTACK_RANGE`, `SKILL_RANGE` (by `SkillRange` tag), `PARTY_START_X`,
  `ENEMY_SPAWN_X`, `UNIT_SPACING`, `STAGE_LEFT_LIMIT`.
- **`battlefield.ts`** — pure positional helpers (no state): `Side`, `advanceDirection(side)`,
  `frontMost(units, side)`, `distance(a, b)`, `stepFor(deltaMs)`, and
  `approach(x, targetX, step, range)` (move toward a target but stop `range` short, never
  overshoot). These are the geometry primitives; everything else composes them.
- **`battle-unit.ts`** — `BattleUnit` wraps a `Combatant` with the deliberately-stateful battle
  data: `side`, `x`, basic-attack timer, `engageRange`, an optional skill loadout
  (`{ def, rank }[]`), and a per-unit `CooldownTracker`. `isAlive` reads the combatant's HP.
  `compute-don't-store` holds: stats still come from `combatant.getStat`; only positions/timers
  are stored.
- **`battle.ts`** — `Battle` engine for **one** encounter (party vs a fixed enemy list). A locked,
  deterministic `tick(deltaMs)`: (1) advance cooldowns, (2) move each living unit toward its target
  (party then enemies), (3) act — skills first, then basic attacks paced by
  `timeBetweenAttacks(attackSpeed)` via `Rng` — (4) resolve `status` (`ongoing|won|lost`).
- **`stage-runner.ts`** — `StageRunner` drives a persistent party through an ordered list of
  monster **waves**. When the current wave is cleared it spawns the next (resetting positions); the
  stage is `cleared` when the last wave (boss) falls and `wiped` when the party dies.

## 2. Steps (TDD order)

- [ ] **10.1 `tuning.ts` + `battlefield.ts`** — geometry primitives. _Tests:_ `frontMost` picks
      min-`x` for party / max-`x` for enemy; `approach` with a small range closes the full gap, with
      a large range stops early (melee vs ranged); `approach` never overshoots; `distance` is
      symmetric.
- [ ] **10.2 `battle-unit.ts` + `battle.ts`** — the single-encounter engine. _Tests
      (deterministic, seeded):_ a `+attack` party beats a weak monster; a fixed seed reproduces an
      identical blow-by-blow (HP trace); the party **wins** a 1-monster wave; the party **wipes**
      vs an overtuned monster; front-to-back targeting (the front enemy dies before the back one
      takes damage); a damage skill fires when ready + in range and goes on cooldown.
- [ ] **10.3 `stage-runner.ts`** — wave/stage runner. _Tests:_ runs N waves then the boss
      (`currentWaveIndex` advances; `status` ends `cleared`); a party that survives clears all
      waves; an overtuned wave `wiped`s the party; the same script always spawns the same monster
      count (fixed reward).

## 3. Deferrals logged when M10 starts

| ID    | What                                                      | Why deferred                                                         |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| D-022 | Per-unit / stat-driven movement speed                     | One shared `MOVE_SPEED` constant is enough to prove the loop.        |
| D-023 | Buff / debuff skills applied in-battle (charges, provoke) | Needs combatants to carry dynamic modifier sources + a clamp rework. |
| D-016 | Battle visuals / formation UI / juice (pre-registered)    | UI polish is an outer-shell concern.                                 |
