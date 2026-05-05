'use client';

import { LookbookImageBox } from './LookbookImageBox';
import type { AsymmetricPairSection } from '@/lib/types';

/**
 * AsymmetricPair
 *
 * Two images with deliberate asymmetry — one larger, one smaller,
 * one offset vertically. The visual tension is the point.
 *
 * Layout decisions encoded in the section config:
 *   weight   1-99 (clamped to 20-80 for sanity), width % of LEFT image.
 *            Right column gets the remainder.
 *   offset   px to translate the SMALLER image vertically. + = down.
 *   larger   'left' | 'right' — which side carries the larger image.
 *            Drives both aspect ratios and which side is offset.
 *
 * Mobile (<768px) collapses to a stacked single-column layout per
 * spec §6, but preserves SOME asymmetry by giving the second image
 * a 12% horizontal margin offset — keeps the editorial feel without
 * the full grid juggling that desktop does.
 */
interface AsymmetricPairProps {
  section: AsymmetricPairSection;
  /** Lightbox click for the left image. */
  onLeftClick: (originRect: DOMRect) => void;
  /** Lightbox click for the right image. */
  onRightClick: (originRect: DOMRect) => void;
}

export function AsymmetricPair({
  section,
  onLeftClick,
  onRightClick,
}: AsymmetricPairProps) {
  const weight = clampWeight(section.weight ?? 70);
  const offset = section.offset ?? 100;
  const isLeftLarger = (section.larger ?? 'left') === 'left';

  const leftPct = weight;
  const rightPct = 100 - weight;

  // The smaller image gets the vertical offset. We push it down
  // (or up, if offset is negative) via translateY — transforms don't
  // affect layout flow so adjacent sections aren't bumped.
  const leftOffsetStyle = !isLeftLarger
    ? { transform: `translateY(${offset}px)` }
    : undefined;
  const rightOffsetStyle = isLeftLarger
    ? { transform: `translateY(${offset}px)` }
    : undefined;

  // Larger image renders as 4:5 portrait; smaller as 1:1 square.
  // The visual hierarchy reads as "tall + short" which feels
  // editorial — equal heights would feel like a catalog grid.
  const leftAspect = isLeftLarger ? 'aspect-[4/5]' : 'aspect-[1/1]';
  const rightAspect = !isLeftLarger ? 'aspect-[4/5]' : 'aspect-[1/1]';

  return (
    <section
      aria-label="Lookbook pair"
      className="bg-ink py-section-mobile md:py-section-desktop"
    >
      {/* Mobile: stacked single column with horizontal offset on the smaller image */}
      <div className="space-y-12 px-4 md:hidden">
        <LookbookImageBox
          image={section.leftImage}
          aspectClass={leftAspect}
          sizes="100vw"
          onClick={onLeftClick}
          className={!isLeftLarger ? 'mr-[12%]' : undefined}
        />
        <LookbookImageBox
          image={section.rightImage}
          aspectClass={rightAspect}
          sizes="100vw"
          onClick={onRightClick}
          className={isLeftLarger ? 'ml-[12%]' : undefined}
        />
      </div>

      {/* Desktop: side-by-side with weighted columns + vertical offset */}
      <div className="mx-auto hidden max-w-[1680px] gap-6 px-12 md:flex lg:px-16">
        <div style={{ width: `${leftPct}%`, ...leftOffsetStyle }}>
          <LookbookImageBox
            image={section.leftImage}
            aspectClass={leftAspect}
            sizes={`${leftPct}vw`}
            onClick={onLeftClick}
          />
        </div>
        <div style={{ width: `${rightPct}%`, ...rightOffsetStyle }}>
          <LookbookImageBox
            image={section.rightImage}
            aspectClass={rightAspect}
            sizes={`${rightPct}vw`}
            onClick={onRightClick}
          />
        </div>
      </div>
    </section>
  );
}

/** Clamp weight to 20-80 so neither column collapses to nothing. */
function clampWeight(w: number): number {
  if (!Number.isFinite(w)) return 70;
  return Math.max(20, Math.min(80, w));
}
