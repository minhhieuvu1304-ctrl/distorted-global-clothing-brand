'use client';

import { useMemo } from 'react';
import { LookbookImageBox } from './LookbookImageBox';
import { useMediaQuery } from '@/lib/hooks';
import type { LookbookImage } from '@/lib/types';

/**
 * MasonryGrid — Pinterest-style image grid for the lookbook.
 *
 * Replaces the per-section modular layout (FullBleedSingle, Triptych,
 * AsymmetricPair, DetailStack) with a single dense column grid. Three
 * columns on desktop, two on mobile, ~8px gutters. Cards have variable
 * heights driven by the `aspect` field on each image so the grid feels
 * organic without being random.
 *
 * Why columns over CSS Grid masonry:
 *   - True CSS masonry isn't yet supported across browsers reliably.
 *   - CSS `columns` (the multi-column layout) does masonry naturally,
 *     but it lays items out top-to-bottom-left-to-right per column,
 *     which scrambles source order across the grid as a whole.
 *   - Our balanced-column algorithm preserves SOURCE order (item 1
 *     comes before item 2 visually), which keeps the click handlers
 *     and lightbox keyboard navigation predictable.
 *
 * Each card carries a `globalIndex` — the position in the flat
 * lookbook image array — that the parent component computes ahead of
 * time. Click handler dispatches that index up to the parent's
 * lightbox state.
 *
 * Spans:
 *   Cards with `span: 'full'` opt out of the column system and span
 *   the full width as their own row. Used for full-width text breaks
 *   so the masonry rhythm is interrupted in a controlled way.
 */

export type MasonryAspect = 'tall' | 'medium' | 'short' | 'square';

export interface MasonryItem {
  /** Unique key for React rendering. */
  id: string;
  /** Image data — same shape used by the lightbox. */
  image: LookbookImage;
  /**
   * Card height ratio. `tall` = 4:5 portrait, `medium` = 1:1.2,
   * `short` = 4:3 landscape, `square` = 1:1. Tweaking these is
   * how the lookbook designer creates rhythm.
   */
  aspect: MasonryAspect;
  /**
   * Position in the global flat-image array — used by the lightbox
   * for keyboard navigation between cards. Computed by the parent.
   */
  globalIndex: number;
}

interface MasonryGridProps {
  items: MasonryItem[];
  onCardClick: (globalIndex: number, originRect: DOMRect) => void;
  /** Max number of columns on desktop. Default 3. */
  desktopColumns?: 2 | 3 | 4;
}

const ASPECT_TO_CLASS: Record<MasonryAspect, string> = {
  tall: 'aspect-[4/5]',
  medium: 'aspect-[5/6]',
  short: 'aspect-[4/3]',
  square: 'aspect-square',
};

// Approximate heights used only for the column-balancing algorithm.
// We don't need pixel-perfect — just relative weights so the
// distribution looks balanced.
const ASPECT_WEIGHT: Record<MasonryAspect, number> = {
  tall: 1.25,
  medium: 1.2,
  short: 0.75,
  square: 1.0,
};

export function MasonryGrid({
  items,
  onCardClick,
  desktopColumns = 3,
}: MasonryGridProps) {
  // Two breakpoints: <768px = 2 cols, >=768px = configured (default 3).
  // useMediaQuery is SSR-safe and returns false during initial render,
  // so first paint uses the mobile column count and resolves up after
  // hydration. That's the safe direction (avoids horizontal layout
  // shift on desktop).
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const columnCount = isDesktop ? desktopColumns : 2;

  // Distribute items into columns using a "shortest column wins"
  // greedy algorithm. Since items are walked in source order, items
  // appear left-to-right top-to-bottom in column groups.
  const columns = useMemo(
    () => distributeIntoColumns(items, columnCount),
    [items, columnCount]
  );

  return (
    <div className="flex w-full gap-2 md:gap-3">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-1 flex-col gap-2 md:gap-3">
          {column.map((item) => (
            <MasonryCard
              key={item.id}
              item={item}
              onClick={(rect) => onCardClick(item.globalIndex, rect)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────────────────────────────

interface MasonryCardProps {
  item: MasonryItem;
  onClick: (originRect: DOMRect) => void;
}

function MasonryCard({ item, onClick }: MasonryCardProps) {
  return (
    <LookbookImageBox
      image={item.image}
      aspectClass={ASPECT_TO_CLASS[item.aspect]}
      // Each card occupies ~33vw on desktop, ~50vw on mobile — drives
      // next/image's responsive `srcset` selection.
      sizes="(min-width: 768px) 33vw, 50vw"
      onClick={onClick}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────
// Column distribution algorithm
// ──────────────────────────────────────────────────────────────────────

/**
 * Greedy "shortest column wins" — walk items in order, place each
 * into whichever column has the smallest accumulated height.
 *
 * Trade-off: this preserves source order within each column but not
 * across columns. Item 7 might end up in column 1 above item 5 from
 * column 2 — that's fine for a lookbook (the order is curatorial,
 * not narrative), and it produces visually balanced columns.
 *
 * If precise source order across columns ever becomes important,
 * swap this for a row-based algorithm (place items left-to-right
 * across columns one at a time). The trade is balance for order.
 */
function distributeIntoColumns(
  items: MasonryItem[],
  columnCount: number
): MasonryItem[][] {
  const columns: MasonryItem[][] = Array.from(
    { length: columnCount },
    () => []
  );
  const columnHeights = new Array<number>(columnCount).fill(0);

  for (const item of items) {
    // Find shortest column. ties go to leftmost — keeps reading order.
    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (columnHeights[i]! < columnHeights[shortest]!) {
        shortest = i;
      }
    }
    columns[shortest]!.push(item);
    columnHeights[shortest]! += ASPECT_WEIGHT[item.aspect];
  }

  return columns;
}
