import { useState, useReducer } from "react";
import "./App.css";
import { Character, STATS } from "./domain/stats";
import {
  Equipment,
  Inventory,
  EQUIPMENT_SLOTS,
  SEED_ITEMS,
  rarityMultiplier,
  generateItem,
} from "./domain/items";
import { SeededRng } from "./domain/rng";
import {
  asCombatant,
  TrainingDummy,
  resolveAttack,
  timeBetweenAttacks,
  physicalResist,
  hitDamageFromStats,
} from "./domain/combat";
import type { Stat } from "./domain/stats";
import type { EquipmentSlot, Item } from "./domain/items";

// Created at module load time (once per app session).
// Non-deterministic seed is intentional here — this is the outer UI layer.
// Domain code never calls Math.random(); it always receives this injected rng.
const appRng = new SeededRng(Date.now());

const CHARACTER_LEVEL = 5;

const BASE_STATS: Partial<Record<Stat, number>> = {
  hp: 100,
  attack: 10,
  physicalDamage: 5,
  armor: 10,
};

const RARITY_CLASS: Record<string, string> = {
  Common: "rarity-common",
  Uncommon: "rarity-uncommon",
  Rare: "rarity-rare",
  Epic: "rarity-epic",
  Legendary: "rarity-legendary",
};

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: "⚔️ Weapon",
  helm: "🪖 Helm",
  body: "🛡️ Body",
  gloves: "🧤 Gloves",
  boots: "👢 Boots",
  ring: "💍 Ring",
  amulet: "📿 Amulet",
};

function formatModifiers(item: Item): string {
  return item.modifiers
    .map((m) =>
      m.kind === "flat"
        ? `+${m.value} ${m.attribute}`
        : `+${Math.round(m.value * 100)}% ${m.attribute}`,
    )
    .join(", ");
}

function App() {
  // useState with lazy initializers creates each object exactly once.
  // The same instance is returned on every re-render, so mutations
  // (equip, use, advance) are reflected without re-creating the objects.
  const [equipment] = useState(() => new Equipment());
  const [inventory] = useState(() => {
    const inv = new Inventory();
    SEED_ITEMS.forEach((item) => inv.add(item));
    return inv;
  });
  const [character] = useState(
    () => new Character(BASE_STATS, [equipment], CHARACTER_LEVEL),
  );
  const [dummy] = useState(
    () => new TrainingDummy("Training Dummy", { hp: 200, armor: 20 }),
  );
  const [combatLog, setCombatLog] = useState<string[]>([]);

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  function handleEquip(item: Item) {
    const displaced = equipment.equip(item, CHARACTER_LEVEL);
    inventory.remove(item);
    if (displaced) inventory.add(displaced);
    forceUpdate();
  }

  function handleUnequip(slot: EquipmentSlot) {
    const item = equipment.unequip(slot);
    if (item) inventory.add(item);
    forceUpdate();
  }

  function handleUse(item: Item) {
    character.use(item);
    inventory.remove(item);
    forceUpdate();
  }

  function handleNextTurn() {
    character.advance(1);
    forceUpdate();
  }

  function handleGenerateItem() {
    const item = generateItem(appRng, { itemLevel: CHARACTER_LEVEL });
    inventory.add(item);
    forceUpdate();
  }

  function handleAttackDummy() {
    const result = resolveAttack(asCombatant(character, "Hero"), dummy, appRng);
    const message = result.dodged
      ? `${dummy.name} dodged the attack!`
      : result.blocked
        ? `${dummy.name} blocked the attack!`
        : `Hit ${dummy.name} for ${result.damage} damage` +
          (result.defeated ? " — defeated!" : ".");
    setCombatLog((prev) => [message, ...prev].slice(0, 8));
  }

  function handleResetDummy() {
    dummy.reset();
    setCombatLog([]);
    forceUpdate();
  }

  const activeBuffs = character.getActiveBuffs();

  return (
    <main className="game">
      <h1 className="game-title">Sacerdos</h1>
      <p className="game-subtitle">Level {CHARACTER_LEVEL}</p>

      <section className="panel">
        <h2 className="panel-heading">Stats</h2>
        <table className="stats-table">
          <tbody>
            {STATS.map((stat) => (
              <tr key={stat}>
                <th>{stat}</th>
                <td>
                  {stat === "hp"
                    ? `${character.currentHP} / ${character.getStat("hp")}`
                    : character.getStat(stat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="panel-heading">Combat</h2>
        <table className="stats-table">
          <tbody>
            <tr>
              <th>Hit damage</th>
              <td>{hitDamageFromStats((s) => character.getStat(s))}</td>
            </tr>
            <tr>
              <th>Attack interval</th>
              <td>{timeBetweenAttacks(character.getStat("attackSpeed"))} ms</td>
            </tr>
            <tr>
              <th>Physical resist</th>
              <td>
                {Math.round(physicalResist(character.getStat("armor")) * 100)}%
              </td>
            </tr>
          </tbody>
        </table>

        <p className="dummy-hp">
          {dummy.name}: {dummy.currentHP} / {dummy.getStat("hp")} HP
        </p>
        <div className="combat-actions">
          <button
            className="next-turn-btn"
            onClick={handleAttackDummy}
            disabled={dummy.currentHP <= 0}
          >
            Attack Dummy
          </button>
          <button className="next-turn-btn" onClick={handleResetDummy}>
            Reset Dummy
          </button>
        </div>

        {combatLog.length > 0 && (
          <ul className="combat-log">
            {combatLog.map((line, i) => (
              <li key={`${combatLog.length - i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      {activeBuffs.length > 0 && (
        <section className="panel">
          <h2 className="panel-heading">Active Buffs</h2>
          <ul className="buff-list">
            {activeBuffs.map(({ def, remaining }) => (
              <li key={def.id} className="buff-row">
                <span className="buff-name">{def.name}</span>
                <span className="buff-timer">
                  {remaining} turn{remaining !== 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2 className="panel-heading">Equipment</h2>
        <ul className="slot-list">
          {EQUIPMENT_SLOTS.map((slot) => {
            const item = equipment.getEquipped(slot);
            return (
              <li key={slot} className="slot-row">
                <span className="slot-label">{SLOT_LABEL[slot]}</span>
                {item ? (
                  <button
                    className={`item-chip equipped ${RARITY_CLASS[item.rarity]}`}
                    onClick={() => handleUnequip(slot)}
                    title="Click to unequip"
                  >
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta item-meta--rarity">
                      {item.rarity} ×{rarityMultiplier(item.rarity)}
                    </span>
                    <span className="item-mods">{formatModifiers(item)}</span>
                  </button>
                ) : (
                  <span className="slot-empty">—</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-heading">Inventory</h2>
        {inventory.items.length === 0 ? (
          <p className="empty-msg">Inventory empty</p>
        ) : (
          <ul className="item-list">
            {inventory.items.map((item) => (
              <li key={item.id}>
                {item.kind === "consumable" ? (
                  <button
                    className={`item-chip ${RARITY_CLASS[item.rarity]}`}
                    onClick={() => handleUse(item)}
                    title="Click to use"
                  >
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta item-meta--use">
                      {item.rarity} · Use
                    </span>
                    {item.buff && (
                      <span className="item-mods">
                        {item.buff.modifiers
                          .map((m) =>
                            m.kind === "flat"
                              ? `+${m.value} ${m.attribute}`
                              : `+${Math.round(m.value * 100)}% ${m.attribute}`,
                          )
                          .join(", ")}{" "}
                        for {item.buff.duration} turns
                      </span>
                    )}
                    {item.instantEffects && (
                      <span className="item-mods">
                        {item.instantEffects
                          .map((e) => `Heal +${e.amount} ${e.attribute}`)
                          .join(", ")}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    className={`item-chip ${RARITY_CLASS[item.rarity]}`}
                    onClick={() => handleEquip(item)}
                    title={`Equip to ${item.slot}`}
                  >
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">
                      {item.rarity} ×{rarityMultiplier(item.rarity)} ·{" "}
                      {item.slot}
                    </span>
                    <span className="item-mods">{formatModifiers(item)}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="next-turn-btn" onClick={handleNextTurn}>
        Next Turn
      </button>
      <button className="next-turn-btn" onClick={handleGenerateItem}>
        Generate Item
      </button>
    </main>
  );
}

export default App;
