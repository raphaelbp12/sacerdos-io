/**
 * Wallet (M13) — holds the player's gold, the main currency.
 *
 * The balance can be added to and spent from but **never goes negative**: spending more than
 * the balance is rejected (throws), consistent with how M7 skill-points reject illegal ops.
 * `canAfford` is the non-throwing check for callers that want to branch first.
 */
export class Wallet {
  private _balance: number;

  constructor(initial = 0) {
    assertNonNegative(initial, "initial balance");
    this._balance = initial;
  }

  /** Current gold held. */
  get balance(): number {
    return this._balance;
  }

  /** Add gold to the balance. */
  add(amount: number): void {
    assertNonNegative(amount, "amount");
    this._balance += amount;
  }

  /** Whether the balance can cover `amount`. */
  canAfford(amount: number): boolean {
    assertNonNegative(amount, "amount");
    return this._balance >= amount;
  }

  /** Spend `amount`; throws (leaving the balance unchanged) if it can't be afforded. */
  spend(amount: number): void {
    assertNonNegative(amount, "amount");
    if (amount > this._balance) {
      throw new Error(
        `cannot spend ${amount}; balance is only ${this._balance}.`,
      );
    }
    this._balance -= amount;
  }
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${label} must be a non-negative finite number, got ${value}.`,
    );
  }
}
