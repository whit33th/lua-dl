/**
 * Merge Tailwind CSS classes with support for conflicts
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
