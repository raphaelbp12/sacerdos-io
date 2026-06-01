import { useRef, useReducer } from "react";
import "./App.css";
import { Character, ATTRIBUTES } from "./domain/stats";
import { Equipment, Inventory, EQUIPMENT_SLOTS } from "./domain/items";
import type { Attribute } from "./domain/stats";
import type { EquipmentSlot, Item } from "./domain/items";
import { SEED_ITEMS } from "./domain/items/seed-items";

const CHARACTER_LEVEL = 5;

const BASE_STATS: Record<Attribute, number> = {
  HP: 100,
  MP: 80,
  STR: 10,
  AGI: 10,
  INT: 10,
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
  const equipmentRef = useRef<Equipment | null>(null);
  if (equipmentRef.current === null) {
    equipmentRef.current = new Equipment();
  }

  const inventoryRef = useRef<Inventory | null>(null);
  if (inventoryRef.current === null) {
    const inv = new Inventory();
    SEED_ITEMS.forEach((item) => inv.add(item));
    inventoryRef.current = inv;
  }

  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const equipment = equipmentRef.current;
  const inventory = inventoryRef.current;
  const character = new Character(BASE_STATS, [equipment], CHARACTER_LEVEL);

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

  return (
    <main className="game">
      <h1 className="game-title">Sacerdos</h1>
      <p className="game-subtitle">Level {CHARACTER_LEVEL}</p>

      <section className="panel">
        <h2 className="panel-heading">Stats</h2>
        <table className="stats-table">
          <tbody>
            {ATTRIBUTES.map((attr) => (
              <tr key={attr}>
                <th>{attr}</th>
                <td>{character.getStat(attr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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
          <p className="empty-msg">All items equipped</p>
        ) : (
          <ul className="item-list">
            {inventory.items.map((item) => (
              <li key={item.id}>
                <button
                  className={`item-chip ${RARITY_CLASS[item.rarity]}`}
                  onClick={() => handleEquip(item)}
                  title={`Equip to ${item.slot}`}
                >
                  <span className="item-name">{item.name}</span>
                  <span className="item-meta">
                    {item.rarity} · {item.slot}
                  </span>
                  <span className="item-mods">{formatModifiers(item)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
