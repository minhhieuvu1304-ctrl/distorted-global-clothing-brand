'use client';

import { useMemo, useState } from 'react';
import { lookbookSections } from '@/config/lookbook.config';
import { Cover } from './Cover';
import { FullBleedSingle } from './FullBleedSingle';
import { AsymmetricPair } from './AsymmetricPair';
import { Triptych } from './Triptych';
import { DetailStack } from './DetailStack';
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
// Masonry grouping — merge consecutive masonry sections into one grid
// ──────────────────────────────────────────────────────────────────────

interface MasonryGroupInfo {
  /**
   * For each section index in lookbookSections, what the renderer
   * should do with that section relative to masonry grouping:
   *
   *   'start'    — first masonry in a group; render the merged
   *                <MasonryGrid> here (with items from this section
   *                AND all consecutive masonry siblings absorbed).
   *   'absorbed' — masonry section whose items were rolled into an
   *                earlier 'start' section; render nothing.
   *   'other'    — not a masonry section; render normally (covers,
   *                detail stacks, etc.). Note: text-break sections
   *                are tagged 'other' too (they still don't render
   *                in the switch, just for unrelated reasons).
   */
  kind: 'start' | 'absorbed' | 'other';
  /**
   * Only set when kind === 'start'. The merged items array — flat
   * sequence of every masonry item from this section + consecutive
   * masonry siblings (text-breaks skipped). Item order matches
   * config order. The `desktopColumns` setting comes from the FIRST
   * section in the run (subsequent settings are ignored — usually
   * they're all the same anyway).
   */
  mergedItems?: Array<{
    sectionIndex: number;
    itemIndex: number;
    image: LookbookImage;
    aspect: 'tall' | 'medium' | 'short' | 'square';
  }>;
  desktopColumns?: 2 | 3 | 4;
}

/**
 * Walk the sections array and produce a per-index grouping plan.
 *
 * Why merge: each <MasonryGrid> independently balances its columns.
 * Three masonry sections back-to-back produces three separate
 * balancing runs, which means columns inside each section don't
 * align with adjacent sections — you get a visible "stair step"
 * seam where short columns from section A leave dead air below
 * before section B's row starts.
 *
 * Merging into one grid means the algorithm balances ALL items
 * across the three columns top-to-bottom-of-page — no seams,
 * no internal dead air.
 *
 * "Consecutive" allows text-break sections in between, because
 * those are hidden in the UI anyway (per Nov 2026 client request).
 * Any image-rendering section between two masonry sections (cover,
 * triptych, etc.) would break the group — which is the right
 * behavior; you don't want them merging across visual interruptions.
 */
function computeMasonryGroups(sections: LookbookSection[]): MasonryGroupInfo[] {
  const result: MasonryGroupInfo[] = sections.map(() => ({ kind: 'other' }));

  let i = 0;
  while (i < sections.length) {
    if (sections[i]!.type !== 'masonry') {
      i++;
      continue;
    }

    // Found a masonry section. Walk forward, absorbing subsequent
    // masonry sections (allowing text-break separators) until we
    // hit something else or run out of sections.
    const startIndex = i;
    const merged: NonNullable<MasonryGroupInfo['mergedItems']> = [];
    const firstSection = sections[startIndex]!;
    // TS narrowing — the `if` above guarantees this is 'masonry'.
    if (firstSection.type !== 'masonry') {
      i++;
      continue;
    }
    const desktopColumns = firstSection.desktopColumns ?? 3;

    let j = startIndex;
    while (j < sections.length) {
      const s = sections[j]!;
      if (s.type === 'masonry') {
        s.items.forEach((it, k) => {
          merged.push({
            sectionIndex: j,
            itemIndex: k,
            image: it.image,
            aspect: it.aspect ?? 'medium',
          });
        });
        if (j !== startIndex) {
          result[j] = { kind: 'absorbed' };
        }
        j++;
      } else if (s.type === 'text-break') {
        // Text-break doesn't break the group (it's hidden in the UI
        // per client request). Mark it 'other' (default) so the
        // switch still falls into the null-returning text-break case.
        j++;
      } else {
        // Any other section type ends the group.
        break;
      }
    }

    result[startIndex] = {
      kind: 'start',
      mergedItems: merged,
      desktopColumns,
    };
    i = j;
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────

export function LookbookClient() {
  const { all, offsets } = useMemo(() => flattenImages(lookbookSections), []);
  const groups = useMemo(
    () => computeMasonryGroups(lookbookSections),
    []
  );

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
            // If this masonry section was absorbed into an earlier
            // group, render nothing — its items are already showing
            // in the start-of-group's merged <MasonryGrid>.
            const group = groups[i];
            if (!group || group.kind === 'absorbed') {
              return null;
            }
            // If this section is the START of a group, the items here
            // are the merged set from this section + every consecutive
            // masonry sibling. Click handler uses each item's
            // recorded sectionIndex + itemIndex to compute its global
            // lightbox index from the precomputed offsets table.
            const items =
              group.kind === 'start' && group.mergedItems
                ? group.mergedItems
                : section.items.map((it, k) => ({
                    sectionIndex: i,
                    itemIndex: k,
                    image: it.image,
                    aspect: it.aspect ?? ('medium' as const),
                  }));
            const desktopColumns =
              group.kind === 'start' && group.desktopColumns
                ? group.desktopColumns
                : section.desktopColumns ?? 3;
            const masonryItems: MasonryItem[] = items.map((it) => {
              const baseOffset = offsets[it.sectionIndex] ?? 0;
              return {
                id: `${it.sectionIndex}-${it.itemIndex}-${it.image.src}`,
                image: it.image,
                aspect: it.aspect,
                globalIndex: baseOffset + it.itemIndex,
              };
            });
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
                  desktopColumns={desktopColumns}
                />
              </section>
            );
          }
          case 'text-break':
            // Text-break interludes hidden per client request
            // (Nov 2026): the lookbook now reads as an uninterrupted
            // photo flow with no copywriting pauses.
            //
            // The sections are still defined in /config/lookbook.config.ts
            // — they're just not rendered. To bring them back, replace
            // `return null` here with the previous TextBreakBand JSX:
            //
            //   return <TextBreakBand key={i} copy={section.copy}
            //                         align={section.align} />;
            //
            // The TextBreakBand component itself is also still in the
            // codebase (components/sections/lookbook/TextBreakBand.tsx).
            return null;
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
