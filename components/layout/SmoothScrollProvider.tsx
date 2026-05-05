'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Lenis smooth-scroll provider.
 *
 * Per spec §2, smooth scroll inertia is enabled site-wide via Lenis.
 * Per spec §13, `prefers-reduced-motion` MUST disable it — we simply
 * don't initialize Lenis at all in that case, so the browser falls
 * back to native scroll.
 *
 * Lenis is initialized once and animated via requestAnimationFrame.
 * We attach `data-lenis-prevent` support implicitly — any descendant
 * with that attribute will scroll natively (useful for modals/drawers
 * built in later prompts).
 *
 * This is a "render nothing" provider — it just runs the side effect
 * and is dropped into <body> alongside the normal page tree.
 */
export function SmoothScrollProvider() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out-expo
      // The locked motion language is restrained — stronger inertia
      // would feel "designy" rather than considered. These values
      // match a tasteful editorial feel.
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return null;
}
