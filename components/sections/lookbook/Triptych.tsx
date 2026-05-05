'use client';

import { LookbookImageBox } from './LookbookImageBox';
import type { TriptychSection } from '@/lib/types';

/**
 * Triptych
 *
 * Three images in a row. Equal thirds by default; optional `weights`
 * triple lets the middle (or any column) take more space.
 *
 * Mobile collapses to single-column stack per spec §6.
 *
 * The aspect ratio is 3:4 portrait by default — slightly taller than
 * 4:3 so three columns at 33% width each don't read as squat.
 */
interface TriptychProps {
  section: TriptychSection;
  /** Lightbox click handler for each of the three images by index. */
  onImageClick: (indexInTriptych: 0 | 1 | 2, originRect: DOMRect) => void;
}

export function Triptych({ section, onImageClick }: TriptychProps) {
  const [a, b, c] = section.images;
  const weights = section.weights ?? [1, 1, 1];

  return (
    <section
      aria-label="Lookbook triptych"
      className="bg-ink py-section-mobile md:py-section-desktop"
    >
      {/* Mobile: stacked singles */}
      <div className="space-y-8 px-4 md:hidden">
        <LookbookImageBox
          image={a}
          aspectClass="aspect-[3/4]"
          sizes="100vw"
          onClick={(rect) => onImageClick(0, rect)}
        />
        <LookbookImageBox
          image={b}
          aspectClass="aspect-[3/4]"
          sizes="100vw"
          onClick={(rect) => onImageClick(1, rect)}
        />
        <LookbookImageBox
          image={c}
          aspectClass="aspect-[3/4]"
          sizes="100vw"
          onClick={(rect) => onImageClick(2, rect)}
        />
      </div>

      {/* Desktop: 3-col row with weighted flex-grow */}
      <div className="mx-auto hidden max-w-[1680px] gap-6 px-12 md:flex lg:px-16">
        <div style={{ flexGrow: weights[0], flexBasis: 0 }}>
          <LookbookImageBox
            image={a}
            aspectClass="aspect-[3/4]"
            sizes="33vw"
            onClick={(rect) => onImageClick(0, rect)}
          />
        </div>
        <div style={{ flexGrow: weights[1], flexBasis: 0 }}>
          <LookbookImageBox
            image={b}
            aspectClass="aspect-[3/4]"
            sizes="33vw"
            onClick={(rect) => onImageClick(1, rect)}
          />
        </div>
        <div style={{ flexGrow: weights[2], flexBasis: 0 }}>
          <LookbookImageBox
            image={c}
            aspectClass="aspect-[3/4]"
            sizes="33vw"
            onClick={(rect) => onImageClick(2, rect)}
          />
        </div>
      </div>
    </section>
  );
}
