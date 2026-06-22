import type { ReactNode } from "react";
import { cx } from "./cx";

/** Heading text (levels 1–3 map to weight/size, not document outline). */
export function Heading({
  level = 2,
  children,
}: {
  level?: 1 | 2 | 3;
  children: ReactNode;
}) {
  return <p className={cx("heading", `heading--${level}`)}>{children}</p>;
}

/** Body text, optionally muted or monospaced. */
export function Text({
  muted,
  mono,
  children,
}: {
  muted?: boolean;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <p className={cx("text", muted && "text--muted", mono && "text--mono")}>
      {children}
    </p>
  );
}

/** Inline label. */
export function Label({ children }: { children: ReactNode }) {
  return <span className="label">{children}</span>;
}
