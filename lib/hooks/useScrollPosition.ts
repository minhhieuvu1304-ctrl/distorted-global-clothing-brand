'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the current vertical scroll position, updated on every
 * scroll/resize tick and throttled to one rAF callback per frame.
 *
 * Useful for: nav background swaps, parallax, scroll-linked progress.
 * Prefer `useIntersection` for "is this element visible" — it's
 * cheaper than reading scroll Y on every consumer.
 */
export function useScrollPosition(): number {
  const [y, setY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setY(window.scrollY);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    update(); // initial
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return y;
}
