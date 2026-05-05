'use client';

import Image from 'next/image';
import { useMediaQuery, useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';
import type { ProductImage } from '@/lib/types';

/**
 * CrossfadeImage
 *
 * Spec §2 motion: "Image hover (general): 800ms cross-fade."
 * Used by product cards (spec §5): primary image visible, secondary
 * fades in on hover, no scale.
 *
 * Two images stacked absolutely. Primary always rendered; secondary
 * rendered with opacity 0→1 transition. On touch devices, no hover —
 * only the primary is shown (matches spec mobile guidance).
 *
 * The wrapper sets `aspect-[3/2]` to match the spec's product image
 * ratio. Override via `aspect` prop if needed for non-shop usage.
 */
interface CrossfadeImageProps {
  primary: ProductImage;
  secondary?: ProductImage;
  /** Tailwind aspect class. Default 'aspect-[3/2]' (spec §5). */
  aspect?: string;
  /** Sizes attribute for next/image responsive loading. */
  sizes?: string;
  /** Whether to mark the primary image as priority (above-the-fold). */
  priority?: boolean;
  className?: string;
}

export function CrossfadeImage({
  primary,
  secondary,
  aspect = 'aspect-[3/2]',
  sizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
  priority = false,
  className,
}: CrossfadeImageProps) {
  const hasHover = useMediaQuery('(hover: hover)');
  const reduced = useReducedMotion();
  const crossfadeEnabled = hasHover && !reduced && !!secondary;

  return (
    <div
      className={cn('group relative w-full overflow-hidden', aspect, className)}
    >
      <Image
        src={primary.src}
        alt={primary.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          'object-cover',
          crossfadeEnabled &&
            'transition-opacity duration-800 ease-out group-hover:opacity-0'
        )}
      />
      {secondary && crossfadeEnabled && (
        <Image
          src={secondary.src}
          alt={secondary.alt}
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-800 ease-out group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
