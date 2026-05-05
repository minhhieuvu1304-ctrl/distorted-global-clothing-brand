/**
 * Shared type definitions for distorted.global.
 *
 * Source-of-truth types live close to their data:
 *   - SiteConfig + HeroVideoSource come from /config/site.config.ts.
 *   - Product types come from /lib/shopify/types.ts (real Shopify
 *     shape as of Prompt 3 — the placeholder version that lived here
 *     in Prompt 2 has been removed).
 *   - LookbookModule (spec §6) is unique to this file because the
 *     lookbook is a content layout system, not a data model.
 *
 * This file is the convenience import surface — most code should
 * import from here rather than reaching directly into shopify/types.
 */

// ──────────────────────────────────────────────────────────────────────
// Re-exports from site config
// ──────────────────────────────────────────────────────────────────────
export type {
  SiteConfig,
  HeroVideoSource,
  FooterColumn,
  FooterLink,
  NavLink,
} from '@/config/site.config';

// ──────────────────────────────────────────────────────────────────────
// Re-exports from Shopify integration (Prompt 3)
// ──────────────────────────────────────────────────────────────────────
export type {
  Product,
  ProductVariant,
  ProductImage,
  ProductCategory,
  Cart,
  CartLineItem,
} from '@/lib/shopify';

// ──────────────────────────────────────────────────────────────────────
// LookbookSection — discriminated union per spec §6 + Prompt 6
// ──────────────────────────────────────────────────────────────────────

/**
 * Per spec §6, the lookbook is "an ordered list of modules in a single
 * config file" — reorderable, expandable. Each section is a layout
 * primitive that the lookbook page renders in sequence.
 *
 * Adding a new layout = add a new variant to this union + add a
 * renderer for it in /app/lookbook/page.tsx. TS will fail any switch
 * that misses a case (exhaustiveness checking).
 *
 * Naming note: Prompt 2 named this `LookbookModule`; Prompt 6 names
 * it `LookbookSection` (matching the example `lookbookSections` array).
 * We use `LookbookSection` and keep `LookbookModule` as a legacy alias.
 */
export interface LookbookImage {
  /** In-page source (~1400px per spec §6 performance). */
  src: string;
  /** Higher-res for lightbox (~2400px per spec §6). */
  srcHighRes: string;
  alt: string;
  /**
   * Object-position focal point for `object-fit: cover`. Values 0-100
   * map to CSS percentages; default is 50/50 (centered). Used when
   * the image's intrinsic aspect ratio doesn't match the module's
   * expected ratio (page layout aesthetics take priority per spec §6).
   */
  focalPoint?: { x: number; y: number };
}

export type LookbookSection =
  | CoverSection
  | FullBleedSingleSection
  | AsymmetricPairSection
  | TriptychSection
  | DetailStackSection
  | TextBreakSection
  | MasonrySection;

/**
 * Cover — first section of the lookbook. Full-bleed cinematic image
 * (100vh) with a Bodoni overlay (chapter / season title) and a
 * scroll cue. 600ms fade-in on page load.
 */
export interface CoverSection {
  type: 'cover';
  image: LookbookImage;
  /** Bodoni overlay copy — typically the chapter or season name. */
  title: string;
  /** Bottom-left or center-bottom positioning. Default 'bottom-left'. */
  titlePosition?: 'bottom-left' | 'center-bottom';
}

/** Single full-bleed image, edge-to-edge. Default 100vh; configurable. */
export interface FullBleedSingleSection {
  type: 'full-bleed-single';
  image: LookbookImage;
  /** CSS height value. Default '100vh'. Examples: '80vh', '120vh', '900px'. */
  height?: string;
}

/**
 * Two images side-by-side with intentional asymmetry. Mobile collapses
 * to stacked singles with offset margins per spec §6.
 */
export interface AsymmetricPairSection {
  type: 'asymmetric-pair';
  leftImage: LookbookImage;
  rightImage: LookbookImage;
  /**
   * Width percentage of the left image (1-99). Right image gets the
   * remainder (minus the gutter). Default 70 → left:70%, right:~30%.
   */
  weight?: number;
  /**
   * Vertical pixel offset of the smaller image relative to the larger.
   * Positive pushes it down; negative pulls it up. Default 100.
   */
  offset?: number;
  /** Which side is the larger image. Default 'left'. */
  larger?: 'left' | 'right';
}

/**
 * Three images in a row. Equal thirds by default; weighted optional.
 */
export interface TriptychSection {
  type: 'triptych';
  images: [LookbookImage, LookbookImage, LookbookImage];
  /**
   * Optional column ratio as three numbers (must sum to 100 for clarity,
   * though any positive triple works — they're flex-grow weights).
   * Example: [30, 40, 30] for slight middle emphasis.
   * Default: equal thirds.
   */
  weights?: [number, number, number];
}

/**
 * Vertical stack of small detail-shot images (2-4). Smaller than
 * full-bleed; max-width ~600px, centered or offset.
 */
export interface DetailStackSection {
  type: 'detail-stack';
  images: LookbookImage[];
  /** Horizontal alignment of the stack. Default 'center'. */
  align?: 'left' | 'center' | 'right';
  /** Max-width in px. Default 600. */
  maxWidth?: number;
}

/**
 * Single line of Bodoni copy on a dark backdrop, used as a pause.
 * 60-80vh, no image.
 */
export interface TextBreakSection {
  type: 'text-break';
  copy: string;
  /** Default 'center'. */
  align?: 'left' | 'center';
}

/**
 * Aspect ratio for a masonry card. The value drives both the
 * rendered card height (via Tailwind aspect-* class) and the
 * column-balancing weight in the masonry algorithm.
 *
 *   tall    4:5 portrait — most editorial
 *   medium  5:6 portrait — slightly less elongated
 *   short   4:3 landscape — gives breathing room in a tall column
 *   square  1:1 — versatile, good for detail shots
 */
export type MasonryAspect = 'tall' | 'medium' | 'short' | 'square';

export interface MasonryCardItem {
  image: LookbookImage;
  /** Default 'medium' if omitted. */
  aspect?: MasonryAspect;
}

/**
 * Pinterest-style dense grid section. Replaces the old per-section
 * modular layouts (full-bleed-single / asymmetric-pair / triptych /
 * detail-stack) for v2 of the lookbook page.
 *
 * Three columns desktop, two columns mobile, ~12px gutters. Cards
 * have variable heights driven by `aspect` per item — the masonry
 * algorithm balances columns by accumulated height so the grid feels
 * organic without being random.
 *
 * To extend: append items to the `items` array and pick an `aspect`.
 * The grid self-balances. No need to think about column placement.
 */
export interface MasonrySection {
  type: 'masonry';
  items: MasonryCardItem[];
  /** Max columns on desktop. Default 3. Set to 4 for denser grids. */
  desktopColumns?: 2 | 3 | 4;
}

/**
 * Legacy alias from Prompt 2. New code should use LookbookSection.
 * Kept here so any imports from before Prompt 6 still resolve.
 */
export type LookbookModule = LookbookSection;
