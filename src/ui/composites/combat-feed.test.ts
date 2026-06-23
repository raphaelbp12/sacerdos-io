import { describe, it, expect } from "vitest";
import { ingestBattleEvents } from "./combat-feed";
import type { BattleEvent } from "../../domain/battle";

describe("ingestBattleEvents (M24 combat feed)", () => {
  it("turns a landed hit into a damage floater and a feed line", () => {
    const events: BattleEvent[] = [
      {
        type: "hit",
        attacker: "Knight",
        target: "Goblin",
        targetSide: "enemy",
        x: 100,
        damage: 42,
        blocked: false,
        dodged: false,
        defeated: false,
        element: "physical",
      },
    ];

    const { floaters, lines, nextId } = ingestBattleEvents(events, 0);

    expect(floaters).toEqual([{ id: 0, x: 100, text: "-42", tone: "hit" }]);
    expect(lines).toEqual(["Knight hits Goblin for 42"]);
    expect(nextId).toBe(1);
  });

  it("labels blocked and dodged hits without damage numbers", () => {
    const events: BattleEvent[] = [
      {
        type: "hit",
        attacker: "Goblin",
        target: "Knight",
        targetSide: "party",
        x: 50,
        damage: 0,
        blocked: true,
        dodged: false,
        defeated: false,
        element: "physical",
      },
      {
        type: "hit",
        attacker: "Goblin",
        target: "Rogue",
        targetSide: "party",
        x: 60,
        damage: 0,
        blocked: false,
        dodged: true,
        defeated: false,
        element: "physical",
      },
    ];

    const { floaters, lines } = ingestBattleEvents(events, 0);

    expect(floaters.map((f) => f.tone)).toEqual(["block", "dodge"]);
    expect(floaters.map((f) => f.text)).toEqual(["BLOCK", "DODGE"]);
    expect(lines).toEqual(["Knight blocks Goblin", "Rogue dodges Goblin"]);
  });

  it("narrates a death event", () => {
    const events: BattleEvent[] = [
      { type: "death", unit: "Goblin", side: "enemy", x: 100 },
    ];

    const { floaters, lines } = ingestBattleEvents(events, 5);

    expect(floaters).toEqual([
      { id: 5, x: 100, text: "DEFEATED", tone: "death" },
    ]);
    expect(lines).toEqual(["Goblin is defeated"]);
  });

  it("threads ids so floater keys stay unique across calls", () => {
    const hit: BattleEvent = {
      type: "hit",
      attacker: "A",
      target: "B",
      targetSide: "enemy",
      x: 0,
      damage: 1,
      blocked: false,
      dodged: false,
      defeated: false,
      element: "physical",
    };

    const first = ingestBattleEvents([hit], 0);
    const second = ingestBattleEvents([hit], first.nextId);

    expect(first.floaters[0].id).toBe(0);
    expect(second.floaters[0].id).toBe(1);
  });
});
