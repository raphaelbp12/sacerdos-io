/** Public barrel for the death & revive subsystem (M12). */

export {
  BASE_RESPAWN_MS,
  MIN_RESPAWN_MS,
  INSTANT_REVIVE_BASE_COST,
  INSTANT_REVIVE_COST_PER_LEVEL,
} from "./tuning";

export type { Revivable, RespawnReduction } from "./respawn";
export { isDowned, effectiveRespawnMs, RespawnQueue } from "./respawn";

export { reviveAll } from "./revive-all";

export { instantReviveCost } from "./revive-cost";
