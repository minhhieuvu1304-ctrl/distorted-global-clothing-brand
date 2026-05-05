/**
 * Re-export shim — actual hook lives in /lib/hooks/useReducedMotion.ts.
 * Kept here so the Prompt 1 import path (`@/lib/useReducedMotion`)
 * continues to work in the SmoothScrollProvider and elsewhere.
 */
export { useReducedMotion } from './hooks/useReducedMotion';
