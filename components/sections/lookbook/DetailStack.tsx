'use client';

import { LookbookImageBox } from './LookbookImageBox';
import type { DetailStackSection } from '@/lib/types';
import { cn } from '@/lib/cn';

/**
 * DetailStack
 *
 * Vertical stack of 2-4 small detail-shot images. Used for fabric
 * close-ups, hardware, stitching — moments where the photo IS the
 * detail rather than a full silhouette.
 *
 * Each image renders at a 4:3 aspect (the spec §6 default). The stack
 * is constrained to `maxWidth` (default 600px) and aligned within the
 * page via the `align` prop:
 *
 *   center — centered in the viewport (default; restrained, classic)
 *   left   — flush to the left section padding (asymmetric edge)
 *   right  — flush to the right (mirrors left for variety)
 */
interface DetailStackProps {
  section: DetailStackSection;
  /**
   * Click handler — receives the image's index within the stack.
   * The page maps this to a global lightbox index.
   */
  onImageClick: (indexInStack: number, originRect: DOMRect) => void;
}

export function DetailStack({ section, onImageClick }: DetailStackProps) {
  const align = section.align ?? 'center';
  const maxWidth = section.maxWidth ?? 600;

  // Container alignment: center uses mx-auto; left/right use the
  // section padding plus optional auto-margin on the opposite side.
  const containerAlignment =
    align === 'center' ? 'mx-auto' : align === 'left' ? 'mr-auto' : 'ml-auto';

  return (
    <section
      aria-label="Lookbook detail stack"
      className="bg-ink py-section-mobile md:py-section-desktop"
    >
      <div className="px-4 md:px-12 lg:px-16">
        <div
          className={cn('flex flex-col gap-4 md:gap-6', containerAlignment)}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {section.images.map((img, i) => (
            <LookbookImageBox
              key={`${img.src}-${i}`}
              image={img}
              aspectClass="aspect-[4/3]"
              sizes={`(min-width: 768px) ${maxWidth}px, 100vw`}
              onClick={(rect) => onImageClick(i, rect)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
