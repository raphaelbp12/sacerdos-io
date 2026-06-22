/**
 * Public surface for the application layer (the seam the UI shell wraps).
 *
 * `GameSession` orchestrates the domain systems behind player actions; it is the
 * outermost non-UI layer (`app → persistence → offline → domain`). Nothing inner
 * imports it.
 */

export type { StageReport } from "./game-session";
export {
  GameSession,
  createInitialGame,
  loadGame,
  DEFAULT_INVENTORY_CAPACITY,
  DEFAULT_STASH_TAB_CAPACITY,
  STARTER_CLASS_ID,
  STARTER_WEAPON_BASE_ID,
} from "./game-session";
