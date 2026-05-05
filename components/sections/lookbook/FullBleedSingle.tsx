'use client';

import { LookbookImageBox } from './LookbookImageBox';
import type { FullBleedSingleSection } from '@/lib/types';

/**
 * FullBleedSingle
 *
 * Single image, edge-to-edge across the viewport. Default height
 * 100vh; override via `section.height` for shorter spreads.
 *
 * Per spec §6 generous-negative-space rule, full-bleed sections sit
 * directly on the page background (--ink) with no padding around
 * them — the image touches every edge.
 */
interface FullBleedSingleProps {
  section: FullBleedSingleSection;
  /** Page-level lightbox click handler. */
  onImageClick: (originRect: DOMRect) => void;
}

export function FullBleedSingle({
  section,
  onImageClick,
}: FullBleedSingleProps) {
  const height = section.height ?? '100vh';

  return (
    <section
      aria-label="Lookbook image"
      className="w-full bg-ink"
      style={{ height }}
    >
      <LookbookImageBox
        image={section.image}
        aspectClass="h-full w-full"
        sizes="100vw"
        onClick={onImageClick}
      />
    </section>
  );
}
