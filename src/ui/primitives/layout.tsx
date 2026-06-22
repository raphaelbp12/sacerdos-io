import type { ReactNode } from "react";
import { cx } from "./cx";

/** Single-column page wrapper with an optional title. */
export function Screen({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="screen">
      {title && <h1 className="screen-title">{title}</h1>}
      {children}
    </section>
  );
}

/** Titled card section. */
export function Panel({
  heading,
  children,
}: {
  heading?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      {heading && <h2 className="panel-heading">{heading}</h2>}
      {children}
    </section>
  );
}

/** Vertical flex container. */
export function Stack({ children }: { children: ReactNode }) {
  return <div className="stack">{children}</div>;
}

/** Horizontal flex container with alignment variants. */
export function Row({
  wrap,
  justify,
  align,
  children,
}: {
  wrap?: boolean;
  justify?: "between" | "end";
  align?: "top";
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "row",
        wrap && "row--wrap",
        justify === "between" && "row--between",
        justify === "end" && "row--end",
        align === "top" && "row--top",
      )}
    >
      {children}
    </div>
  );
}

/** Responsive auto-fill grid (inventory / stash). */
export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid">{children}</div>;
}
