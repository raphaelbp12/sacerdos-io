import { describe, it, expect } from "vitest";
import {
  BASE_RESPAWN_MS,
  effectiveRespawnMs,
  isDowned,
  RespawnQueue,
  reviveAll,
  instantReviveCost,
  type Revivable,
} from "./index";
import { Character } from "../stats";

/** A minimal in-test `Revivable`: full HP `max`, knocked out at 0, revives to full. */
class FakeUnit implements Revivable {
  private readonly max: number;
  private hp: number;
  constructor(max: number) {
    this.max = max;
    this.hp = max;
  }
  get currentHP(): number {
    return this.hp;
  }
  kill(): void {
    this.hp = 0;
  }
  revive(): void {
    this.hp = this.max;
  }
}

// ── 12.1 respawn timer ───────────────────────────────────────────────────────

describe("effectiveRespawnMs", () => {
  it("is the 2-minute base with no reduction", () => {
    expect(effectiveRespawnMs()).toBe(BASE_RESPAWN_MS);
    expect(BASE_RESPAWN_MS).toBe(120_000);
  });

  it("applies a flat ms shave", () => {
    expect(effectiveRespawnMs({ flatMs: 20_000 })).toBe(100_000);
  });

  it("applies a percentage reduction", () => {
    expect(effectiveRespawnMs({ percent: 0.5 })).toBe(60_000);
  });

  it("applies flat first, then percent", () => {
    expect(effectiveRespawnMs({ flatMs: 20_000, percent: 0.5 })).toBe(50_000);
  });

  it("floors at 0 for an over-reduction", () => {
    expect(effectiveRespawnMs({ flatMs: 999_999 })).toBe(0);
    expect(effectiveRespawnMs({ percent: 2 })).toBe(0);
  });
});

describe("RespawnQueue", () => {
  it("starts empty", () => {
    expect(new RespawnQueue().pendingCount).toBe(0);
  });

  it("queues a downed unit and keeps it down before the timer elapses", () => {
    const queue = new RespawnQueue();
    const unit = new FakeUnit(100);
    unit.kill();

    queue.down(unit);
    expect(queue.isPending(unit)).toBe(true);
    expect(queue.remainingFor(unit)).toBe(BASE_RESPAWN_MS);

    queue.advance(BASE_RESPAWN_MS - 1);
    expect(isDowned(unit)).toBe(true);
    expect(queue.remainingFor(unit)).toBe(1);
  });

  it("revives the unit (full HP) when the timer reaches 0", () => {
    const queue = new RespawnQueue();
    const unit = new FakeUnit(100);
    unit.kill();

    queue.down(unit);
    queue.advance(BASE_RESPAWN_MS);

    expect(isDowned(unit)).toBe(false);
    expect(unit.currentHP).toBe(100);
    expect(queue.isPending(unit)).toBe(false);
    expect(queue.pendingCount).toBe(0);
  });

  it("shortens the wait by a reduction", () => {
    const queue = new RespawnQueue();
    const unit = new FakeUnit(100);
    unit.kill();

    queue.down(unit, { percent: 0.5 });
    queue.advance(60_000);

    expect(isDowned(unit)).toBe(false);
    expect(unit.currentHP).toBe(100);
  });

  it("is idempotent — a unit already waiting is not re-queued", () => {
    const queue = new RespawnQueue();
    const unit = new FakeUnit(100);
    unit.kill();

    queue.down(unit);
    queue.advance(60_000);
    queue.down(unit); // should NOT reset the timer
    expect(queue.remainingFor(unit)).toBe(60_000);
    expect(queue.pendingCount).toBe(1);
  });
});

// ── 12.2 revive-all at stage start ───────────────────────────────────────────

describe("Character.revive", () => {
  it("restores a downed character to full HP", () => {
    const hero = new Character({ hp: 100 });
    hero.takeDamage(100);
    expect(hero.currentHP).toBe(0);

    hero.revive();
    expect(hero.currentHP).toBe(100);
  });
});

describe("reviveAll", () => {
  it("brings the whole group (dead and hurt) back to full HP", () => {
    const dead = new Character({ hp: 100 });
    const hurt = new Character({ hp: 80 });
    dead.takeDamage(100);
    hurt.takeDamage(30);

    reviveAll([dead, hurt]);

    expect(dead.currentHP).toBe(100);
    expect(hurt.currentHP).toBe(80);
  });
});

// ── 12.3 paid instant-revive placeholder (D-017) ─────────────────────────────

describe("instantReviveCost", () => {
  it("is a deterministic placeholder scaling with level", () => {
    expect(instantReviveCost(1)).toBe(50);
    expect(instantReviveCost(10)).toBe(140);
  });

  it("rejects non-positive or non-integer levels", () => {
    expect(() => instantReviveCost(0)).toThrow();
    expect(() => instantReviveCost(-1)).toThrow();
    expect(() => instantReviveCost(1.5)).toThrow();
  });
});
