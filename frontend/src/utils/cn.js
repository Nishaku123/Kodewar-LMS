/**
 * Joins class names and ignores empty/false values.
 * Example: cn("p-4", isActive && "bg-ink-800") -> "p-4 bg-ink-800"
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
