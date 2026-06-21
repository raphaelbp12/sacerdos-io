import type { Revivable } from "./respawn";

/**
 * Revive-all at stage start (M12): entering a stage **restores the group**, so
 * every member — dead or merely hurt — is brought back to full HP.
 */
export function reviveAll(members: readonly Revivable[]): void {
  for (const member of members) {
    member.revive();
  }
}
