import { cx } from "./cx";

export interface TabItem<T extends string> {
  readonly id: T;
  readonly label: string;
}

/** In-screen pill tab switch. */
export function Tabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: readonly TabItem<T>[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={cx("tab", tab.id === active && "tab--active")}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
