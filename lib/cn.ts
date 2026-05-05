/**
 * Minimal className concatenator.
 *
 * Filters out falsy values so you can safely write:
 *   cn('base', condition && 'extra', undefined)
 *
 * If we later need conflict resolution between conflicting Tailwind
 * classes (e.g. `text-paper` overriding `text-mist`), upgrade this to
 * use `clsx` + `tailwind-merge`. Not needed for foundation.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
