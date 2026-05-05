'use client';

import { useEffect, useState } from 'react';

/**
 * Detects the user's `prefers-reduced-motion` setting and stays in
 * sync with changes (e.g. user toggles the OS setting in another tab).
 *
 * Per spec §2 + §13, this flag must:
 *   - disable Lenis smooth scroll
 *   - disable scroll-reveal fade-ups
 *   - disable hover scale animations (lookbook)
 *   - disable hero video autoplay (fall back to poster image)
 *
 * Components consume this hook and either skip animation entirely
 * or render a static alternative.
 *
 * SSR note: the initial render returns `false` (no preference assumed)
 * to keep server/client markup in sync. The effect updates on mount.
 * Components that branch on this should ensure the non-reduced markup
 * is the safe default for SSR.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers use addEventListener; older Safari uses addListener.
    if (query.addEventListener) {
      query.addEventListener('change', handleChange);
      return () => query.removeEventListener('change', handleChange);
    } else {
      // Legacy API for older Safari (<14). The lib types still expose these.
      query.addListener(handleChange);
      return () => query.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}
