'use client';

import { type ReactNode, type MouseEvent } from 'react';
import { useMediaQuery, useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * ImageHover
 *
 * Spec §6 + §2 lookbook hover (LOCKED):
 *   - Scale: 1.04
 *   - Transition: 400ms cubic-bezier(0.22, 1, 0.36, 1)
 *   - Shadow: 0 30px 60px rgba(0,0,0,0.4)
 *   - Z-index lift on hover
 *   - Cursor: '+' / view indicator (custom cursor lands post-launch §16)
 *   - Disabled on touch (no hover concept) — tap goes straight to lightbox
 *   - Reduced-motion disables the transform entirely
 *
 * The wrapper is `relative` and applies the transform on the inner
 * `group-hover:` element — children should be positioned to fill it
 * (typically a next/image with `fill` or a 3:2 box).
 */
interface ImageHoverProps {
  children: ReactNode;
  /** Click handler — triggers lightbox in lookbook usage. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Accessible label for screen readers. */
  label?: string;
  /** Extra classes for the outer wrapper. */
  className?: string;
}

export function ImageHover({
  children,
  onClick,
  label = 'View image',
  className,
}: ImageHoverProps) {
  const hasHover = useMediaQuery('(hover: hover)');
  const reduced = useReducedMotion();
  const motionEnabled = hasHover && !reduced;

  // Custom cursor "+" — pure CSS approach using a data-URI cursor.
  // White-on-transparent 24x24 circle with crosshairs. Falls back to
  // 'zoom-in' if the browser ignores the data URI.
  const cursorStyle: React.CSSProperties = motionEnabled
    ? {
        cursor:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='11' fill='none' stroke='white' stroke-width='1'/><line x1='12' y1='6' x2='12' y2='18' stroke='white' stroke-width='1'/><line x1='6' y1='12' x2='18' y2='12' stroke='white' stroke-width='1'/></svg>\") 12 12, zoom-in",
      }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('group relative block w-full text-left', className)}
      style={cursorStyle}
    >
      <div
        className={cn(
          'relative h-full w-full',
          motionEnabled &&
            'transition-transform duration-400 ease-lookbook group-hover:z-10 group-hover:scale-[1.04] group-hover:shadow-lookbook'
        )}
      >
        {children}
      </div>
    </button>
  );
}
