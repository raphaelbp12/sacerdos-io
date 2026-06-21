import { describe, it, expect } from "vitest";
import { Character } from "../stats";
import { ChargeTracker } from "./charge-tracker";

const raiseShield = {
  id: "raise-shield",
  name: "Raise Shield",
  charges: 3,
  modifiers: [{ attribute: "blockChance", kind: "flat", value: 1 } as const],
};

describe("ChargeTracker", () => {
  it("emits its modifiers while charges remain", () => {
    const charges = new ChargeTracker();
    charges.apply(raiseShield);
    expect(charges.remainingCharges("raise-shield")).toBe(3);
    expect(charges.getModifiers()).toEqual(raiseShield.modifiers);
  });

  it("forces a holder's blockChance to 100% until charges drain", () => {
    const charges = new ChargeTracker();
    const knight = new Character({ blockChance: 0.1 }, [charges]);
    charges.apply(raiseShield);

    expect(knight.getStat("blockChance")).toBe(1); // clamped to [0,1]

    charges.consume();
    charges.consume();
    expect(knight.getStat("blockChance")).toBe(1); // still has 1 charge

    charges.consume(); // third hit consumes the last charge
    expect(charges.remainingCharges("raise-shield")).toBe(0);
    expect(knight.getStat("blockChance")).toBeCloseTo(0.1);
    expect(charges.getModifiers()).toEqual([]);
  });

  it("re-applying refreshes the charge count", () => {
    const charges = new ChargeTracker();
    charges.apply(raiseShield);
    charges.consume();
    expect(charges.remainingCharges("raise-shield")).toBe(2);
    charges.apply(raiseShield);
    expect(charges.remainingCharges("raise-shield")).toBe(3);
  });

  it("consume decrements every active charge buff", () => {
    const charges = new ChargeTracker();
    charges.apply(raiseShield);
    charges.apply({
      id: "second",
      name: "Second",
      charges: 1,
      modifiers: [{ attribute: "dodgeChance", kind: "flat", value: 1 }],
    });
    charges.consume();
    expect(charges.remainingCharges("raise-shield")).toBe(2);
    expect(charges.remainingCharges("second")).toBe(0);
  });

  it("reports zero charges for an unknown buff", () => {
    const charges = new ChargeTracker();
    expect(charges.remainingCharges("nope")).toBe(0);
  });
});
