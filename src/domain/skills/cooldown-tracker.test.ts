import { describe, it, expect } from "vitest";
import { CooldownTracker } from "./cooldown-tracker";

describe("CooldownTracker", () => {
  it("reports a never-used skill as ready", () => {
    const cd = new CooldownTracker();
    expect(cd.isReady("smash")).toBe(true);
    expect(cd.remainingFor("smash")).toBe(0);
  });

  it("goes on cooldown when used and recovers after enough time", () => {
    const cd = new CooldownTracker();
    cd.use("smash", 3000);
    expect(cd.isReady("smash")).toBe(false);
    expect(cd.remainingFor("smash")).toBe(3000);

    cd.advance(1000);
    expect(cd.isReady("smash")).toBe(false);
    expect(cd.remainingFor("smash")).toBe(2000);

    cd.advance(2000);
    expect(cd.isReady("smash")).toBe(true);
    expect(cd.remainingFor("smash")).toBe(0);
  });

  it("applies cooldown reduction to the wait", () => {
    const cd = new CooldownTracker();
    cd.use("smash", 3000, 0.2); // 20% cdr → 2400 ms
    expect(cd.remainingFor("smash")).toBe(2400);
  });

  it("tracks skills independently", () => {
    const cd = new CooldownTracker();
    cd.use("smash", 3000);
    cd.use("provoke", 2000);
    cd.advance(2000);
    expect(cd.isReady("provoke")).toBe(true);
    expect(cd.isReady("smash")).toBe(false);
    expect(cd.remainingFor("smash")).toBe(1000);
  });

  it("rejects using a skill that is still on cooldown", () => {
    const cd = new CooldownTracker();
    cd.use("smash", 3000);
    expect(() => cd.use("smash", 3000)).toThrow(/cooldown/i);
  });

  it("does not let remaining time go negative", () => {
    const cd = new CooldownTracker();
    cd.use("smash", 3000);
    cd.advance(10_000);
    expect(cd.remainingFor("smash")).toBe(0);
    expect(cd.isReady("smash")).toBe(true);
  });
});
