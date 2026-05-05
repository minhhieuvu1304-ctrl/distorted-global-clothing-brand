/**
 * ═══════════════════════════════════════════════════════════════════════
 * LOOKBOOK CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Per spec §6 + Prompt 6 §3, the lookbook is composed entirely from
 * the ordered list below. Each entry is a "section" — a layout
 * primitive that renders one full visual moment in the editorial flow.
 *
 * To reorder: move entries up/down in the array.
 * To add: insert a new section object — TypeScript will guide which
 *   fields are required for each `type`.
 * To remove: delete the section object.
 * To swap module type: change `type` and let TS show what's missing.
 *
 * The full set of available section types is defined in /lib/types.ts
 * as `LookbookSection` (a discriminated union). Available types:
 *
 *   'cover'              — opening 100vh image with title overlay (FIRST entry typically)
 *   'full-bleed-single'  — single image edge-to-edge
 *   'asymmetric-pair'    — two images, weighted + offset
 *   'triptych'           — three-up row
 *   'detail-stack'       — vertical stack of small detail shots
 *   'text-break'         — single Bodoni line on dark backdrop
 *
 * IMAGE FIELDS — each LookbookImage has:
 *   src         in-page URL (~1400px wide)
 *   srcHighRes  zoom URL (~2400px wide)
 *   alt         accessibility alt text
 *   focalPoint  optional { x: 0-100, y: 0-100 } — overrides default 50/50
 *               object-position for object-fit: cover. Use when an
 *               image's subject is off-center and gets cropped wrong.
 *
 * v1 PLACEHOLDER CONTENT
 * Per Prompt 6 §10, this file ships with ~30 placeholder entries
 * pulled from picsum.photos so the layout can be visualized during
 * build. The owner replaces each `src`/`srcHighRes` with real
 * Cloudflare-Images-served URLs at launch. The structure stays.
 *
 * Note: picsum.photos URLs use deterministic seeds via /seed/<name>
 * so each placeholder image is stable across reloads. Replace these
 * with real URLs by editing only the `src` and `srcHighRes` fields —
 * leave the section structure alone unless the layout itself changes.
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LookbookSection, LookbookImage } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────
// Placeholder image factory — keeps the config below readable.
// `seed` makes each image stable across reloads (vs. random picsum).
// At launch, replace the entire body with real Cloudflare URLs.
// ─────────────────────────────────────────────────────────────────────
function ph(
  seed: string,
  alt: string,
  focalPoint?: LookbookImage['focalPoint']
): LookbookImage {
  const base = `https://picsum.photos/seed/${seed}`;
  const result: LookbookImage = {
    src: `${base}/1400/1050`,
    srcHighRes: `${base}/2400/1800`,
    alt,
  };
  if (focalPoint) result.focalPoint = focalPoint;
  return result;
}

export const lookbookSections: LookbookSection[] = [
  // ── Opening cover ──
  {
    type: 'cover',
    image: ph('distorted-cover', 'AW26 Distorted lookbook cover'),
    title: 'AW26',
    titlePosition: 'bottom-left',
  },

  // ── Opening text break — sets the tone before any product imagery ──
  {
    type: 'text-break',
    copy: 'The city as fabric. Worn. Folded. Distorted.',
    align: 'center',
  },

  // ── First full-bleed — establishes the editorial register ──
  {
    type: 'full-bleed-single',
    image: ph('look-01', 'Hero look — black hoodie on industrial backdrop'),
  },

  // ── Asymmetric pair: large left, smaller right offset down ──
  {
    type: 'asymmetric-pair',
    leftImage: ph('look-02-left', 'Full silhouette in oversized hoodie'),
    rightImage: ph('look-02-right', 'Detail of fabric texture'),
    weight: 70,
    offset: 100,
    larger: 'left',
  },

  // ── Triptych: three-up row ──
  {
    type: 'triptych',
    images: [
      ph('look-03-a', 'Side profile, hood up'),
      ph('look-03-b', 'Hands in pockets, mid-shot'),
      ph('look-03-c', 'Walking away, back view'),
    ],
  },

  // ── Detail stack: vertical close-ups ──
  {
    type: 'detail-stack',
    images: [
      ph('detail-01', 'Embroidery detail'),
      ph('detail-02', 'Stitching along seam'),
      ph('detail-03', 'Hardware and label'),
    ],
    align: 'center',
    maxWidth: 600,
  },

  // ── Text break: rhythm pause ──
  {
    type: 'text-break',
    copy: 'Each piece a statement. Each stitch a sentence.',
    align: 'left',
  },

  // ── Full-bleed: hero shirt ──
  {
    type: 'full-bleed-single',
    image: ph('look-04', 'Shirt look, full silhouette'),
  },

  // ── Asymmetric pair, weight reversed: small left, larger right ──
  {
    type: 'asymmetric-pair',
    leftImage: ph('look-05-left', 'Detail of collar'),
    rightImage: ph('look-05-right', 'Full body shot, three-quarter angle'),
    weight: 35,
    offset: -60,
    larger: 'right',
  },

  // ── Triptych weighted toward middle for emphasis ──
  {
    type: 'triptych',
    images: [
      ph('look-06-a', 'Sleeve detail'),
      ph('look-06-b', 'Centered portrait'),
      ph('look-06-c', 'Hem detail'),
    ],
    weights: [25, 50, 25],
  },

  // ── Full-bleed: belt and bottom-half look ──
  {
    type: 'full-bleed-single',
    image: ph('look-07', 'Belt and trousers, mid-frame'),
    height: '80vh',
  },

  // ── Detail stack, offset left ──
  {
    type: 'detail-stack',
    images: [
      ph('detail-04', 'Buckle close-up'),
      ph('detail-05', 'Leather grain'),
    ],
    align: 'left',
    maxWidth: 480,
  },

  // ── Text break ──
  {
    type: 'text-break',
    copy: 'An experience far beyond fabrics.',
    align: 'center',
  },

  // ── Full-bleed: hat shot ──
  {
    type: 'full-bleed-single',
    image: ph('look-08', 'Cap on subject, bust shot'),
  },

  // ── Asymmetric pair: equal weight, but offset for tension ──
  {
    type: 'asymmetric-pair',
    leftImage: ph('look-09-left', 'Studio frontal'),
    rightImage: ph('look-09-right', 'Walking shot'),
    weight: 50,
    offset: 120,
    larger: 'left',
  },

  // ── Triptych ──
  {
    type: 'triptych',
    images: [
      ph('look-10-a', 'Look 10 panel A'),
      ph('look-10-b', 'Look 10 panel B'),
      ph('look-10-c', 'Look 10 panel C'),
    ],
  },

  // ── Full-bleed: closing-style shot ──
  {
    type: 'full-bleed-single',
    image: ph('look-11', 'Subject leaving frame, end-of-shoot energy'),
  },

  // ── Detail stack: 4 close-ups ──
  {
    type: 'detail-stack',
    images: [
      ph('detail-06', 'Detail 06'),
      ph('detail-07', 'Detail 07'),
      ph('detail-08', 'Detail 08'),
      ph('detail-09', 'Detail 09'),
    ],
    align: 'center',
    maxWidth: 540,
  },

  // ── Text break, longer pause before final stretch ──
  {
    type: 'text-break',
    copy: 'Cut. Sewn. Distorted.',
    align: 'center',
  },

  // ── Asymmetric pair ──
  {
    type: 'asymmetric-pair',
    leftImage: ph('look-12-left', 'Look 12 left'),
    rightImage: ph('look-12-right', 'Look 12 right'),
    weight: 60,
    offset: 80,
    larger: 'left',
  },

  // ── Final full-bleed before Instagram + closing ──
  {
    type: 'full-bleed-single',
    image: ph('look-13', 'Final hero look'),
  },
];
