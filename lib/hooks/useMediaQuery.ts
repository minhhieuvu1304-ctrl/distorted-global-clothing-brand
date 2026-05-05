'use client';

import { useEffect, useState } from 'react';

/**
 * Reactive wrapper around `window.matchMedia(query).matches`.
 *
 * Returns `false` during SSR and the first client render to avoid
 * hydration mismatch — the effect updates immediately on mount.
 * Components that branch on this should ensure the desktop/non-matched
 * markup is the safe default.
 *
 * Common queries:
 *   useMediaQuery('(min-width: 768px)')   → desktop
 *   useMediaQuery('(hover: hover)')        → has a real pointer (not touch)
 *   useMediaQuery('(prefers-reduced-motion: reduce)')  → use useReducedMotion
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } else {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, [query]);

  return matches;
}
