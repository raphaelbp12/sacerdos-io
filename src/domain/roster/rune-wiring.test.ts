import { describe, expect, it } from "vitest";
import { RuneState } from "../runes";
import { DEFAULT_HERO_SLOTS, Roster } from "./roster";
import { DEFAULT_GROUP_SLOTS, GroupRoster } from "./group";

/**
 * M19 ↔ M18 wiring: slot capacities are read from the rune tree. `RuneState`
 * exposes `heroSlots(base)` / `groupSlots(base)`; the caller passes the result to
 * the collection constructor (roster stays decoupled from `runes`).
 */
describe("roster/group slot caps read RuneState", () => {
  it("hero slots grow the roster capacity as the rune is bought", () => {
    const runes = new RuneState();
    const base = new Roster(runes.heroSlots(DEFAULT_HERO_SLOTS));
    expect(base.capacity).toBe(DEFAULT_HERO_SLOTS);

    runes.buy("fellowship"); // +1 heroSlots
    runes.buy("fellowship"); // +1 heroSlots
    const grown = new Roster(runes.heroSlots(DEFAULT_HERO_SLOTS));
    expect(grown.capacity).toBe(DEFAULT_HERO_SLOTS + 2);
  });

  it("group slots grow the group-roster capacity as the rune is bought", () => {
    const runes = new RuneState();
    const base = new GroupRoster(runes.groupSlots(DEFAULT_GROUP_SLOTS));
    expect(base.capacity).toBe(DEFAULT_GROUP_SLOTS);

    runes.buy("warband"); // +1 groupSlots
    const grown = new GroupRoster(runes.groupSlots(DEFAULT_GROUP_SLOTS));
    expect(grown.capacity).toBe(DEFAULT_GROUP_SLOTS + 1);
  });
});
