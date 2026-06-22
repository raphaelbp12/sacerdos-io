import { cx } from "./cx";

export interface NavItem<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly icon: string;
}

/** Bottom tab navigation between screens. */
export function NavBar<T extends string>({
  items,
  active,
  onSelect,
}: {
  items: readonly NavItem<T>[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <nav className="nav-bar">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx("nav-item", item.id === active && "nav-item--active")}
          aria-current={item.id === active ? "page" : undefined}
          onClick={() => onSelect(item.id)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
