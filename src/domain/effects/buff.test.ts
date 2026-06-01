import { describe, it, expect } from "vitest";
import { BuffTracker } from "./buff";
import type { BuffDef } from "./buff";

const AGI_BUFF: BuffDef = {
  id: "agi-boost",
  name: "Agility Boost",
  duration: 3,
  modifiers: [{ attribute: "AGI", kind: "flat", value: 5 }],
};

const STR_BUFF: BuffDef = {
  id: "str-boost",
  name: "Strength Boost",
  duration: 5,
  modifiers: [{ attribute: "STR", kind: "flat", value: 3 }],
};

describe("BuffTracker", () => {
  it("starts with no modifiers", () => {
    const t = new BuffTracker();
    expect(t.getModifiers()).toEqual([]);
  });

  it("returns modifiers from an applied buff", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF);
    expect(t.getModifiers()).toEqual(AGI_BUFF.modifiers);
  });

  it("buff expires exactly when its full duration has been advanced", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF); // duration 3
    t.advance(3);
    expect(t.getModifiers()).toEqual([]);
  });

  it("buff is still active one tick before expiry", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF); // duration 3
    t.advance(2);
    expect(t.getModifiers()).toHaveLength(1);
  });

  it("advance can be called in multiple partial steps", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF); // duration 3
    t.advance(1);
    t.advance(1);
    t.advance(1); // total 3 — should expire
    expect(t.getModifiers()).toEqual([]);
  });

  it("re-applying an active buff refreshes (resets) its timer — stacking rule: refresh", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF); // duration 3, remaining = 3
    t.advance(2); // remaining = 1
    t.apply(AGI_BUFF); // refresh → remaining = 3 again
    t.advance(2); // remaining = 1 (would have expired without refresh)
    expect(t.getModifiers()).toHaveLength(1);
    t.advance(1); // remaining = 0 — now expires
    expect(t.getModifiers()).toEqual([]);
  });

  it("two different buffs stack their modifiers independently", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF);
    t.apply(STR_BUFF);
    expect(t.getModifiers()).toHaveLength(2);
  });

  it("one buff can expire while another stays active", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF); // duration 3
    t.apply(STR_BUFF); // duration 5
    t.advance(3); // AGI expires, STR still has 2 left
    const mods = t.getModifiers();
    expect(mods).toHaveLength(1);
    expect(mods[0].attribute).toBe("STR");
  });

  it("getActiveBuffs returns metadata for each active buff", () => {
    const t = new BuffTracker();
    t.apply(AGI_BUFF);
    const active = t.getActiveBuffs();
    expect(active).toHaveLength(1);
    expect(active[0].def.id).toBe("agi-boost");
    expect(active[0].remaining).toBe(3);
  });
});
