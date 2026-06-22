import { createContext, useCallback, useContext, useState } from "react";
import type { GameSession } from "../../app/index";

/** What every screen reads: the live session plus mutation/reload helpers. */
export interface GameContextValue {
  /** The single live coordinator (never reconstructed in a screen). */
  readonly session: GameSession;
  /** Bumped on every mutation so screens re-render off the live domain. */
  readonly version: number;
  /**
   * Run a domain mutation, then trigger a re-render. Returns an error message
   * when the action threw (e.g. equip below level), else `null`.
   */
  readonly run: (fn: () => void) => string | null;
  /** Swap in a different session (used by load / reset on the System screen). */
  readonly reload: (next: GameSession) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

/** Access the game context; throws if used outside the provider. */
export function useGameState(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx)
    throw new Error("useGameState must be used within a GameStateProvider");
  return ctx;
}

/**
 * Convenience over {@link useGameState}: an `act` wrapper that runs a mutation and
 * captures any thrown error message into `error` for the screen to surface.
 */
export function useAction() {
  const { session, version, run, reload } = useGameState();
  const [error, setError] = useState<string | null>(null);
  const act = useCallback((fn: () => void) => setError(run(fn)), [run]);
  const clearError = useCallback(() => setError(null), []);
  return { session, version, act, error, clearError, reload };
}
