'use client';

import { type ReactNode, type ElementType } from 'react';
import { useIntersection, useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * FadeIn
 *
 * Spec §2 motion: "Fade-in on scroll: 600ms ease-out, 20px upward translate."
 *
 * Usage:
 *   <FadeIn>
 *     <h1>...</h1>
 *   </FadeIn>
 *
 * Stagger several elements by passing increasing `delay` values:
 *   <FadeIn delay={0}>...</FadeIn>
 *   <FadeIn delay={120}>...</FadeIn>
 *   <FadeIn delay={240}>...</FadeIn>
 *
 * Reduced motion: renders children at final state with no animation.
 *
 * Implementation note: we apply transition styles directly so the
 * delay can vary per-instance (Tailwind doesn't support arbitrary
 * delays with theme tokens cleanly). The motion timing values still
 * match the locked spec.
 */
interface FadeInProps {
  children: ReactNode;
  /** Delay in ms before animation begins. Default 0. */
  delay?: number;
  /** Render as different element. Default 'div'. */
  as?: ElementType;
  /** Distance to translate from, in px. Default 20 (matches spec). */
  distance?: number;
  /** Fire-once observer threshold (0–1). Default 0.15. */
  threshold?: number;
  /** Extra classes for the wrapper. */
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  as: Tag = 'div',
  distance = 20,
  threshold = 0.15,
  className,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const [ref, visible] = useIntersection<HTMLElement>({
    once: true,
    threshold,
    // Trigger slightly before fully in viewport — feels more natural.
    rootMargin: '0px 0px -10% 0px',
  });

  // When reduced motion is on, render children at rest with no transform
  // and no transition. Otherwise drive opacity/translate via inline style
  // so each instance can have its own delay.
  const animatedStyle: React.CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`,
        willChange: visible ? undefined : 'opacity, transform',
      };

  return (
    <Tag ref={ref} className={cn(className)} style={animatedStyle}>
      {children}
    </Tag>
  );
}
