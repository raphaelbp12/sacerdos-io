import { describe, expect, it } from "vitest";

import { Wallet } from "./wallet";

describe("Wallet", () => {
  it("starts empty by default", () => {
    expect(new Wallet().balance).toBe(0);
  });

  it("can start with a given balance", () => {
    expect(new Wallet(100).balance).toBe(100);
  });

  it("adds gold to the balance", () => {
    const wallet = new Wallet();
    wallet.add(30);
    wallet.add(12);
    expect(wallet.balance).toBe(42);
  });

  it("spends gold it can afford", () => {
    const wallet = new Wallet(50);
    wallet.spend(20);
    expect(wallet.balance).toBe(30);
  });

  it("rejects spending more than the balance and leaves it unchanged", () => {
    const wallet = new Wallet(10);
    expect(() => wallet.spend(11)).toThrow();
    expect(wallet.balance).toBe(10);
  });

  it("reports affordability without spending", () => {
    const wallet = new Wallet(10);
    expect(wallet.canAfford(10)).toBe(true);
    expect(wallet.canAfford(11)).toBe(false);
    expect(wallet.balance).toBe(10);
  });

  it("rejects negative or non-finite amounts", () => {
    const wallet = new Wallet(10);
    expect(() => wallet.add(-1)).toThrow();
    expect(() => wallet.spend(-1)).toThrow();
    expect(() => new Wallet(-1)).toThrow();
    expect(() => wallet.add(Number.NaN)).toThrow();
  });
});
