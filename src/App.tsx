import { useState } from "react";
import "./ui/tokens.css";
import "./ui/components.css";
import { NavBar } from "./ui/primitives";
import type { NavItem } from "./ui/primitives";
import { GoldBar } from "./ui/composites";
import { GameStateProvider, useGameState } from "./ui/state";
import {
  BattleScreen,
  CharacterScreen,
  CubeScreen,
  InventoryScreen,
  RosterScreen,
  RunesScreen,
  SystemScreen,
} from "./ui/screens";

type ScreenId =
  | "battle"
  | "character"
  | "inventory"
  | "cube"
  | "runes"
  | "roster"
  | "system";

const NAV: readonly NavItem<ScreenId>[] = [
  { id: "battle", label: "Battle", icon: "⚔️" },
  { id: "character", label: "Hero", icon: "🧙" },
  { id: "inventory", label: "Bag", icon: "🎒" },
  { id: "cube", label: "Cube", icon: "🧊" },
  { id: "runes", label: "Runes", icon: "🔮" },
  { id: "roster", label: "Roster", icon: "👥" },
  { id: "system", label: "System", icon: "⚙️" },
];

const SCREENS: Record<ScreenId, () => React.JSX.Element> = {
  battle: BattleScreen,
  character: CharacterScreen,
  inventory: InventoryScreen,
  cube: CubeScreen,
  runes: RunesScreen,
  roster: RosterScreen,
  system: SystemScreen,
};

/** Persistent wallet / chest readout, visible on every screen. */
function TopBar() {
  const { session, version } = useGameState();
  // `version` is read so the bar re-renders when the live session mutates.
  void version;
  return (
    <header className="top-bar">
      <span className="heading heading--3">Sacerdos</span>
      <GoldBar gold={session.gold} chests={session.pendingChests.length} />
    </header>
  );
}

function Shell() {
  const [tab, setTab] = useState<ScreenId>("battle");
  const ActiveScreen = SCREENS[tab];
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <ActiveScreen />
      </main>
      <NavBar items={NAV} active={tab} onSelect={setTab} />
    </div>
  );
}

function App() {
  return (
    <GameStateProvider>
      <Shell />
    </GameStateProvider>
  );
}

export default App;
