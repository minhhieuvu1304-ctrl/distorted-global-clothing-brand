'use client';

/**
 * useCustomCursor (stub)
 *
 * Spec §16 lists "custom cursor on lookbook hover" as a deferred
 * post-launch polish item. This is a no-op stub so components written
 * now (e.g. <ImageHover />) can call it without conditional imports
 * once it lands.
 *
 * When implemented, this hook will:
 *   - Track pointer position
 *   - Render a follower element (likely a small "+" or "VIEW" indicator)
 *   - Hide the native cursor while active
 *   - Disable on touch devices and when prefers-reduced-motion is set
 *
 * For now: returns nothing, does nothing.
 */
export function useCustomCursor(): void {
  // Intentionally empty.
}
