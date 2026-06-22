import type { ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ghost" | "danger";

/** The single action element used across the harness. */
export function Button({
  variant,
  size,
  block,
  disabled,
  title,
  onClick,
  children,
}: {
  variant?: ButtonVariant;
  size?: "sm";
  block?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx(
        "btn",
        variant && `btn--${variant}`,
        size === "sm" && "btn--sm",
        block && "btn--block",
      )}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
