import { useMemo, useState, type ReactNode } from "react";
import { GameSession, createInitialGame } from "../../app/index";
import { SeededRng } from "../../domain/rng";
import { GameContext, type GameContextValue } from "./game-context";

/**
 * Owns the one live {@link GameSession} and the single seeded `Rng`. Every screen
 * reads the session from context and mutates it through `run`, which re-renders by
 * bumping a `version` counter (compute-don't-store: domain objects are never cloned).
 *
 * A caller may inject a `session` (tests pass a state seeded with a deterministic
 * `Rng`); otherwise a fresh default game is created with a wall-clock seed — the
 * non-determinism lives only here, in the outer shell, never in the domain.
 */
export function GameStateProvider({
  session: injected,
  children,
}: {
  session?: GameSession;
  children: ReactNode;
}) {
  const [session, setSession] = useState<GameSession>(
    () => injected ?? createInitialGame(new SeededRng(Date.now())),
  );
  const [version, setVersion] = useState(0);

  const value = useMemo<GameContextValue>(
    () => ({
      session,
      version,
      run(fn) {
        try {
          fn();
          setVersion((v) => v + 1);
          return null;
        } catch (error) {
          setVersion((v) => v + 1);
          return error instanceof Error ? error.message : String(error);
        }
      },
      reload(next) {
        setSession(next);
        setVersion((v) => v + 1);
      },
    }),
    [session, version],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
