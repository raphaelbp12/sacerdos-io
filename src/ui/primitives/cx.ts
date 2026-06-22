/** Join truthy class names into a single string (tiny clsx; no dependency). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
