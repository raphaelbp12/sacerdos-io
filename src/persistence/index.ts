/** Public surface for the persistence layer (save / load — M20). */

export type {
  SaveState,
  GameState,
  SavedCharacter,
  SavedGroup,
  SavedSkill,
  ProgressionState,
  InventoryDto,
  StashDto,
} from "./save-state";
export { SAVE_VERSION } from "./save-state";

export {
  serialize,
  deserialize,
  buildMember,
  buildRoster,
  buildGroupRoster,
} from "./serialize";
