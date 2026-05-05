/**
 * ═══════════════════════════════════════════════════════════════════════
 * LOOKBOOK CONFIGURATION (v2 — masonry layout)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Per spec §6 + Prompt 6 + lookbook redesign (Nov 2026), the lookbook
 * is a Pinterest-style dense grid bracketed by a 100vh cover and a
 * closing/Instagram section. Reorderable, expandable.
 *
 * Available section types (defined in /lib/types.ts as LookbookSection):
 *
 *   'cover'       — opening 100vh image with title overlay (FIRST entry)
 *   'masonry'     — Pinterest-style grid; the bulk of the page (~80%)
 *   'text-break'  — compact 30vh Bodoni interruption between masonry blocks
 *
 * Legacy types still available but unused in v2:
 *   'full-bleed-single', 'asymmetric-pair', 'triptych', 'detail-stack'
 *
 * EDITING — common operations:
 *
 *   ➤ Add a new image to the lookbook:
 *     Find any `masonry` section below; append a new item to its
 *     `items` array. Pick an `aspect` to control card height:
 *       'tall'    4:5 portrait (most editorial; default for full looks)
 *       'medium'  5:6 portrait (slightly less elongated)
 *       'short'   4:3 landscape (good for breathing room mid-column)
 *       'square'  1:1 (versatile; great for detail shots)
 *     The grid auto-balances columns by total height — no need to
 *     think about column placement.
 *
 *   ➤ Add a new text break:
 *     Insert a `{ type: 'text-break', copy: '...', align: 'center' }`
 *     between two masonry sections. They stack into the page in order.
 *
 *   ➤ Replace placeholder images with real photography:
 *     Each image has `src` (in-page) and `srcHighRes` (lightbox zoom).
 *     Replace both URLs; leave the structure alone. The owner can
 *     point at Cloudflare Images URLs once those are configured.
 *
 *   ➤ Make the grid denser:
 *     Set `desktopColumns: 4` on a masonry section.
 *     Set it to 2 for a more relaxed grid.
 *
 *   ➤ Reorder sections:
 *     Move entries up/down in the `lookbookSections` array.
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LookbookSection, LookbookImage } from '@/lib/types';

// Placeholder image factory — generates picsum URLs from a seed so
// each image is stable across reloads. At launch, replace these
// `src`/`srcHighRes` URLs with real Cloudflare-Images URLs.
function ph(seed: string, alt: string): LookbookImage {
  const base = `https://picsum.photos/seed/${seed}`;
  return {
    src: `${base}/1200/1500`,
    srcHighRes: `${base}/2400/3000`,
    alt,
  };
}

export const lookbookSections: LookbookSection[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. COVER — full-bleed 100vh hero, AW26 overlay
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'cover',
    image: ph('aw26-cover', 'AW26 — Distorted lookbook cover'),
    title: 'AW26',
    titlePosition: 'bottom-left',
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. OPENING TEXT BREAK — sets the tone before the grid
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'The city as fabric. Worn. Folded. Distorted.',
    align: 'center',
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. FIRST MASONRY BLOCK — 15 cards (full-look establishment)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      {
        image: ph('look-01', 'Look 01 — black hoodie, full silhouette'),
        aspect: 'tall',
      },
      {
        image: ph('look-02', 'Look 02 — three-quarter angle'),
        aspect: 'medium',
      },
      { image: ph('look-03', 'Look 03 — back view, hood up'), aspect: 'tall' },
      {
        image: ph('detail-01', 'Embroidery detail — chest panel'),
        aspect: 'short',
      },
      {
        image: ph('look-04', 'Look 04 — oversized fit, side profile'),
        aspect: 'tall',
      },
      {
        image: ph('look-05', 'Look 05 — walking shot, motion blur'),
        aspect: 'medium',
      },
      { image: ph('detail-02', 'Stitching detail — sleeve'), aspect: 'square' },
      { image: ph('look-06', 'Look 06 — seated portrait'), aspect: 'tall' },
      {
        image: ph('look-07', 'Look 07 — bust crop, hood down'),
        aspect: 'medium',
      },
      {
        image: ph('detail-03', 'Hardware detail — drawstring'),
        aspect: 'short',
      },
      { image: ph('look-08', 'Look 08 — full body, frontal'), aspect: 'tall' },
      {
        image: ph('look-09', 'Look 09 — environmental, rooftop'),
        aspect: 'medium',
      },
      { image: ph('detail-04', 'Label and care tag'), aspect: 'square' },
      {
        image: ph('look-10', 'Look 10 — three-quarter, hood up'),
        aspect: 'tall',
      },
      {
        image: ph('look-11', 'Look 11 — silhouette, low light'),
        aspect: 'medium',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. INTERLUDE TEXT BREAK
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'Each piece a statement. Each stitch a sentence.',
    align: 'left',
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. SECOND MASONRY BLOCK — 15 cards (mid-collection variety)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      { image: ph('shirt-01', 'Shirt 01 — full silhouette'), aspect: 'tall' },
      { image: ph('detail-05', 'Collar detail — open'), aspect: 'short' },
      { image: ph('shirt-02', 'Shirt 02 — three-quarter'), aspect: 'tall' },
      { image: ph('shirt-03', 'Shirt 03 — back panel'), aspect: 'medium' },
      { image: ph('detail-06', 'Cuff and button detail'), aspect: 'square' },
      { image: ph('shirt-04', 'Shirt 04 — seated portrait'), aspect: 'tall' },
      { image: ph('look-12', 'Look 12 — hat shot, bust'), aspect: 'medium' },
      { image: ph('detail-07', 'Cap brim and crown detail'), aspect: 'short' },
      { image: ph('look-13', 'Look 13 — belt and waist crop'), aspect: 'tall' },
      { image: ph('detail-08', 'Belt buckle close-up'), aspect: 'square' },
      { image: ph('look-14', 'Look 14 — full body, hat down'), aspect: 'tall' },
      {
        image: ph('look-15', 'Look 15 — environmental, alley'),
        aspect: 'medium',
      },
      {
        image: ph('detail-09', 'Texture study — fabric weave'),
        aspect: 'short',
      },
      { image: ph('look-16', 'Look 16 — dynamic motion'), aspect: 'tall' },
      { image: ph('look-17', 'Look 17 — quiet portrait'), aspect: 'medium' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. CLOSING INTERLUDE
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'An experience far beyond fabrics.',
    align: 'center',
  },

  // ══════════════════════════════════════════════════════════════════
  // 7. THIRD MASONRY BLOCK — 12 cards (denser closing rhythm)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      {
        image: ph('look-18', 'Look 18 — full crew, exterior'),
        aspect: 'medium',
      },
      { image: ph('detail-10', 'Pocket and hem detail'), aspect: 'short' },
      { image: ph('look-19', 'Look 19 — paired styling'), aspect: 'tall' },
      { image: ph('look-20', 'Look 20 — quiet detail crop'), aspect: 'square' },
      {
        image: ph('look-21', 'Look 21 — final hero, departing'),
        aspect: 'tall',
      },
      { image: ph('detail-11', 'Final detail study'), aspect: 'short' },
      {
        image: ph('look-22', 'Look 22 — group, three subjects'),
        aspect: 'medium',
      },
      { image: ph('detail-12', 'Lining and seam'), aspect: 'square' },
      { image: ph('look-23', 'Look 23 — closing portrait'), aspect: 'tall' },
      {
        image: ph('look-24', 'Look 24 — closing motion shot'),
        aspect: 'medium',
      },
      { image: ph('detail-13', 'Brand label'), aspect: 'short' },
      { image: ph('look-25', 'Look 25 — final frame'), aspect: 'tall' },
    ],
  },
];
