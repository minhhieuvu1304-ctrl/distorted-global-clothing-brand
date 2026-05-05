'use client';

import Image from 'next/image';
import type { MouseEvent } from 'react';
import type { LookbookImage } from '@/lib/types';
import { ImageHover } from '@/components/ui/ImageHover';
import { cn } from '@/lib/cn';

/**
 * LookbookImageBox
 *
 * Shared primitive used by every visual lookbook module. Bundles:
 *   1. An aspect-ratio container.
 *   2. <ImageHover /> for the locked 1.04-scale + shadow + z-lift
 *      hover effect (auto-disabled on touch and reduced motion per
 *      Prompt 2's implementation).
 *   3. <Image> with `object-fit: cover` and a configurable
 *      `object-position` driven by `image.focalPoint`.
 *   4. Click → onClick(originRect) so the page-level lightbox can
 *      animate from the clicked tile's bounding rect.
 *
 * Modules that need different aspect ratios pass `aspectClass`
 * (e.g. `aspect-[3/2]`, `aspect-[2/3]`, `h-screen`). The default
 * `aspect-[4/3]` matches spec §6 ("Default: 4:3").
 *
 * `priority` is used only by the cover module's image — every other
 * lookbook image lazy-loads via next/image's default behavior.
 */
interface LookbookImageBoxProps {
  image: LookbookImage;
  /** Tailwind class controlling the aspect ratio / height of the box. */
  aspectClass?: string;
  /** Extra wrapper classes. */
  className?: string;
  /** Sizes hint for next/image responsive loading. */
  sizes?: string;
  /**
   * Click handler — receives the bounding rect of the clicked element
   * so the page-level Lightbox can animate scale-up from that origin.
   */
  onClick?: (originRect: DOMRect) => void;
  /** Eager-load. Reserved for the cover image only. */
  priority?: boolean;
}

export function LookbookImageBox({
  image,
  aspectClass = 'aspect-[4/3]',
  className,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  onClick,
  priority = false,
}: LookbookImageBoxProps) {
  // Convert focal point (0-100) → CSS object-position string.
  // Default 50% 50% (center) when focalPoint is undefined.
  const focal = image.focalPoint;
  const objectPosition = focal ? `${focal.x}% ${focal.y}%` : '50% 50%';

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (onClick) {
      onClick(e.currentTarget.getBoundingClientRect());
    }
  }

  return (
    <ImageHover
      onClick={handleClick}
      label={`Zoom ${image.alt}`}
      className={cn(aspectClass, 'overflow-hidden bg-smoke', className)}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        className="object-cover"
        style={{ objectPosition }}
      />
    </ImageHover>
  );
}
