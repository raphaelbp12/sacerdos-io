/** Public barrel for the cube subsystem (M17): synthesis, alchemy, leveling. */

export type { Threshold } from "./threshold";
export { THRESHOLDS, withinThreshold } from "./threshold";

export type {
  SynthesisError,
  SynthesisResult,
  SynthesisOptions,
} from "./synthesis";
export { synthesize, SYNTHESIS_RATIO } from "./synthesis";

export { sellValue } from "./alchemy";

export type {
  CubeExpOptions,
  CubeOperation,
  CubeOperationDef,
} from "./cube-exp";
export {
  cubeExpForItem,
  cubeLevelForExp,
  CUBE_EXP_THRESHOLDS,
  CUBE_OPERATIONS,
  isOperationUnlocked,
} from "./cube-exp";
