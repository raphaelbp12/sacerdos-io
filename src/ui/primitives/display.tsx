import type { ReactNode } from "react";
import { cx } from "./cx";

/** Two-column label→value list. */
export function KeyValueList({
  rows,
}: {
  rows: ReadonlyArray<{ key: string; label: string; value: ReactNode }>;
}) {
  return (
    <ul className="kv-list">
      {rows.map((row) => (
        <li key={row.key} className="kv-row">
          <span className="kv-key">{row.label}</span>
          <span className="kv-val">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Accessible progress bar (native <progress>; no inline width). */
export function ProgressBar({
  value,
  max,
  good,
}: {
  value: number;
  max: number;
  good?: boolean;
}) {
  return (
    <progress
      className={cx("progress", good && "progress--good")}
      value={value}
      max={max}
    />
  );
}

/** Small status pill. `tone` maps to a `badge--<tone>` modifier class. */
export function Badge({
  tone,
  children,
}: {
  tone?: string;
  children: ReactNode;
}) {
  return (
    <span className={cx("badge", tone && `badge--${tone}`)}>{children}</span>
  );
}

/** Compact record. Renders as a button when `onClick` is given, else a div. */
export function Chip({
  rarity,
  selected,
  disabled,
  title,
  onClick,
  children,
}: {
  rarity?: string;
  selected?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = cx(
    "chip",
    rarity && `chip--rarity-${rarity}`,
    selected && "chip--selected",
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        title={title}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={className} title={title}>
      {children}
    </div>
  );
}

/** Icon + number readout (gold, chest count, currency). */
export function Counter({
  icon,
  value,
  label,
}: {
  icon: string;
  value: ReactNode;
  label?: string;
}) {
  return (
    <span className="counter-pill" title={label}>
      <span className="counter-icon">{icon}</span>
      <span>{value}</span>
    </span>
  );
}

/** Scrolling line log (most-recent first is the caller's choice). */
export function LogList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="log-list">
      {lines.map((line, i) => (
        <li key={`${lines.length - i}-${line}`} className="log-line">
          {line}
        </li>
      ))}
    </ul>
  );
}

/** "Nothing here" placeholder. */
export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}

/** Monospaced multiline text input (save export / import). */
export function TextArea({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
}) {
  return (
    <textarea
      className="textarea"
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
