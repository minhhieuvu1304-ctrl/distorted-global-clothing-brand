'use client';

import { useMemo, useState } from 'react';
import { lookbookSections } from '@/config/lookbook.config';
import { Cover } from './Cover';
import { FullBleedSingle } from './FullBleedSingle';
import { AsymmetricPair } from './AsymmetricPair';
import { Triptych } from './Triptych';
import { DetailStack } from './DetailStack';
import { TextBreakBand } from './TextBreakBand';
import { MasonryGrid, type MasonryItem } from './MasonryGrid';
import { InstagramFeed } from './InstagramFeed';
import { Closing } from './Closing';
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox';
import type { LookbookImage, LookbookSection } from '@/lib/types';

/**
 * LookbookClient
 *
 * The lookbook page is fully driven by the ordered `lookbookSections`
 * array in config. This component is the coordinator: it walks the
 * config, renders the right module for each entry, and owns the
 * page-level lightbox state.
 *
 * KEY ARCHITECTURE — global image index
 *
 * Per Prompt 6 §7, the lightbox's ←/→ keyboard navigation must cycle
 * through ALL lookbook images in source order (not just images
 * within one module). To make that work cleanly, we:
 *
 *   1. Walk every section, extracting its images in order, and build
 *      a single flat array (`allImages`).
 *   2. Compute each section's starting offset into that flat array
 *      (`offsets[i]`) at the same time.
 *   3. Each module receives a click handler that, given an index
 *      WITHIN the module, produces the GLOBAL index by adding the
 *      section's offset.
 *
 * `text-break` sections are skipped entirely — they have no images.
 *
 * The flat array is computed via useMemo against the static config
 * (which doesn't change at runtime), so it's effectively built once.
 */

// ──────────────────────────────────────────────────────────────────────
// Image flattening — a single source-order traversal
// ──────────────────────────────────────────────────────────────────────

interface FlattenedImages {
  /** Every image in source order. Used by Lightbox. */
  all: LookbookImage[];
  /**
   * For each section in lookbookSections, the starting index of its
   * images in `all`. Sections with no images (text-break) get the
   * same offset as the next image-bearing section (unused but must
   * be a number to keep array indexing simple).
   */
  offsets: number[];
}

function flattenImages(sections: LookbookSection[]): FlattenedImages {
  const all: LookbookImage[] = [];
  const offsets: number[] = [];

  for (const section of sections) {
    offsets.push(all.length);
    switch (section.type) {
      case 'cover':
        all.push(section.image);
        break;
      case 'full-bleed-single':
        all.push(section.image);
        break;
      case 'asymmetric-pair':
        all.push(section.leftImage, section.rightImage);
        break;
      case 'triptych':
        all.push(section.images[0], section.images[1], section.images[2]);
        break;
      case 'detail-stack':
        all.push(...section.images);
        break;
      case 'masonry':
        for (const it of section.items) all.push(it.image);
        break;
      case 'text-break':
        // No images to add; offset still recorded so indexing stays
        // 1:1 with the sections array.
        break;
      default: {
        // Exhaustiveness guard — TypeScript will fail this if a new
        // section type is added without updating the switch.
        const _exhaustive: never = section;
        void _exhaustive;
      }
    }
  }

  return { all, offsets };
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export function LookbookClient() {
  const { all, offsets } = useMemo(() => flattenImages(lookbookSections), []);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxOrigin, setLightboxOrigin] = useState<DOMRect | null>(null);

  // Convert app-shaped LookbookImage[] to Lightbox's LightboxImage[]
  // shape. The dimensions are unknown for picsum placeholders so we
  // pass the standard ~1400px / 2400px sizes the URLs are generated at.
  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      all.map((img) => ({
        src: img.src,
        srcHighRes: img.srcHighRes,
        alt: img.alt,
        // The Lightbox uses these intrinsic dimensions for layout
        // sizing. Real images at launch will have known dimensions
        // — for now we use the placeholder sizes.
        width: 2400,
        height: 1800,
      })),
    [all]
  );

  /**
   * Returns a click handler bound to a specific section index.
   * The returned handler accepts an in-module image index plus the
   * origin rect and dispatches the lightbox open with the global
   * index computed from `offsets[sectionIndex]`.
   */
  function makeClickHandler(sectionIndex: number) {
    const baseOffset = offsets[sectionIndex] ?? 0;
    return (indexInSection: number, originRect: DOMRect) => {
      setLightboxOrigin(originRect);
      setLightboxIndex(baseOffset + indexInSection);
    };
  }

  return (
    <>
      {lookbookSections.map((section, i) => {
        const click = makeClickHandler(i);
        // `key` uses index — sections are static, no reordering at
        // runtime, so index keys are safe and simpler than synthetic IDs.
        switch (section.type) {
          case 'cover':
            return (
              <Cover
                key={i}
                section={section}
                onImageClick={(rect) => click(0, rect)}
              />
            );
          case 'full-bleed-single':
            return (
              <FullBleedSingle
                key={i}
                section={section}
                onImageClick={(rect) => click(0, rect)}
              />
            );
          case 'asymmetric-pair':
            return (
              <AsymmetricPair
                key={i}
                section={section}
                onLeftClick={(rect) => click(0, rect)}
                onRightClick={(rect) => click(1, rect)}
              />
            );
          case 'triptych':
            return (
              <Triptych
                key={i}
                section={section}
                onImageClick={(idx, rect) => click(idx, rect)}
              />
            );
          case 'detail-stack':
            return (
              <DetailStack
                key={i}
                section={section}
                onImageClick={(idx, rect) => click(idx, rect)}
              />
            );
          case 'masonry': {
            // Build the per-item data the grid needs. Each item gets
            // the global lightbox index = section's offset + position
            // within the section. The grid passes that index back up
            // when a card is clicked.
            const baseOffset = offsets[i] ?? 0;
            const masonryItems: MasonryItem[] = section.items.map((it, k) => ({
              id: `${i}-${k}-${it.image.src}`,
              image: it.image,
              aspect: it.aspect ?? 'medium',
              globalIndex: baseOffset + k,
            }));
            return (
              <section
                key={i}
                aria-label="Lookbook gallery"
                // Container padding matches site rhythm (~16px mobile,
                // ~24px desktop). The grid itself handles internal gutters.
                className="bg-ink px-2 py-6 md:px-4 md:py-12"
              >
                <MasonryGrid
                  items={masonryItems}
                  onCardClick={(globalIndex, rect) => {
                    setLightboxOrigin(rect);
                    setLightboxIndex(globalIndex);
                  }}
                  desktopColumns={section.desktopColumns ?? 3}
                />
              </section>
            );
          }
          case 'text-break':
            // v2 lookbook uses TextBreakBand (compact 30vh band)
            // instead of the legacy 60-70vh TextBreak. Both accept
            // the same fields, so swapping is one line.
            return (
              <TextBreakBand
                key={i}
                copy={section.copy}
                align={section.align}
              />
            );
          default: {
            const _exhaustive: never = section;
            void _exhaustive;
            return null;
          }
        }
      })}

      {/* Instagram + Closing always render last per Prompt 6 §7. */}
      <InstagramFeed />
      <Closing />

      {/* Page-level Lightbox — overlays the whole lookbook */}
      <Lightbox
        open={lightboxIndex !== null}
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        originRect={lightboxOrigin}
      />
    </>
  );
}
