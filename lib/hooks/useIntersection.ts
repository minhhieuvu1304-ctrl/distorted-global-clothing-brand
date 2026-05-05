'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseIntersectionOptions extends IntersectionObserverInit {
  /**
   * If true, the hook freezes at `true` once the element first
   * intersects and stops observing. This is the right mode for
   * scroll-reveal animations — once revealed, stay revealed.
   */
  once?: boolean;
}

/**
 * Wrapper around IntersectionObserver.
 *
 * Returns `[ref, isIntersecting]`. Attach the ref to the element
 * you want to observe; consume `isIntersecting` to drive class names
 * or conditional logic.
 *
 * Default behavior is "always reactive" — fires both on enter and
 * exit. Pass `{ once: true }` for scroll-reveals (the common case).
 *
 * SSR-safe: `isIntersecting` starts at `false` and only updates after
 * the IO callback fires on the client.
 */
export function useIntersection<T extends Element = HTMLElement>(
  options: UseIntersectionOptions = {}
): [RefObject<T>, boolean] {
  const { once = false, root, rootMargin, threshold } = options;
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Old browsers — fail-open so content is visible.
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsIntersecting(entry.isIntersecting);
        if (once && entry.isIntersecting) {
          observer.unobserve(node);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, root, rootMargin, threshold]);

  return [ref, isIntersecting];
}
