// lib/types.ts
// Shared types describing the shape of Shopify data.
// Mock data and real Storefront API data both conform to these,
// so the rest of the app never needs to know which one it's using.

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ProductImage {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string; // Shopify GID, e.g. "gid://shopify/ProductVariant/123"
  title: string;
  availableForSale: boolean;
  price?: Money;
  selectedOptions?: { name: string; value: string }[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  priceRange: { minVariantPrice: Money };
  images: { edges: { node: ProductImage }[] };
  variants: { edges: { node: ProductVariant }[] };
}

// What a single line in the cart looks like.
export interface CartItem {
  variantId: string;
  quantity: number;
  // Display info copied in so the cart UI doesn't need to re-fetch.
  productTitle: string;
  variantTitle: string;
  price: string;
  currencyCode: string;
  image: string;
  handle: string;
}

// ──────────────────────────────────────────────────────────────────────
// LookbookSection — discriminated union per spec §6
// ──────────────────────────────────────────────────────────────────────
//
// The lookbook page is driven entirely by an ordered array of these
// sections in /config/lookbook.config.ts. Each section is a layout
// primitive; the page walks the array and renders each in turn.
//
// To add a new layout: add a new variant to the LookbookSection union
// plus a renderer in /app/lookbook/page.tsx (or LookbookClient).
// TypeScript will fail any switch that misses a case.

/**
 * A single image used anywhere in the lookbook.
 *
 * `src`        in-page source (~1400px wide is the sweet spot)
 * `srcHighRes` larger version used by the lightbox (~2400px)
 * `alt`        accessibility text — never null
 * `focalPoint` optional 0-100 x/y percentages for object-position when
 *              cropping. Defaults to centered.
 */
export interface LookbookImage {
  src: string;
  srcHighRes: string;
  alt: string;
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

/** First section of the lookbook. Full-bleed image with overlay title. */
export interface CoverSection {
  type: 'cover';
  image: LookbookImage;
  title: string;
  titlePosition?: 'bottom-left' | 'center-bottom';
}

/** A single edge-to-edge image. Default height 100vh; override via `height`. */
export interface FullBleedSingleSection {
  type: 'full-bleed-single';
  image: LookbookImage;
  height?: string;
}

/** Two images side-by-side with intentional asymmetry. */
export interface AsymmetricPairSection {
  type: 'asymmetric-pair';
  leftImage: LookbookImage;
  rightImage: LookbookImage;
  /** Width % of left image, 1-99. Default 70. */
  weight?: number;
  /** Vertical px offset of the smaller image. Default 100. */
  offset?: number;
  /** Which side is larger. Default 'left'. */
  larger?: 'left' | 'right';
}

/** Three images in a row. Equal thirds by default. */
export interface TriptychSection {
  type: 'triptych';
  images: [LookbookImage, LookbookImage, LookbookImage];
  /** Optional column weights, e.g. [30, 40, 30]. */
  weights?: [number, number, number];
}

/** A vertical stack of smaller detail-shot images. */
export interface DetailStackSection {
  type: 'detail-stack';
  images: LookbookImage[];
  align?: 'left' | 'center' | 'right';
  /** Max-width in px. Default 600. */
  maxWidth?: number;
}

/** A line of editorial Bodoni copy on a dark backdrop — used as a pause. */
export interface TextBreakSection {
  type: 'text-break';
  copy: string;
  align?: 'left' | 'center';
}

/** Aspect ratio bucket for masonry cards. Drives card height + balancing. */
export type MasonryAspect = 'tall' | 'medium' | 'short' | 'square';

export interface MasonryCardItem {
  image: LookbookImage;
  /** Default 'medium' if omitted. */
  aspect?: MasonryAspect;
}

/** Pinterest-style dense grid. 3 columns desktop / 2 mobile by default. */
export interface MasonrySection {
  type: 'masonry';
  items: MasonryCardItem[];
  /** Max columns on desktop. Default 3. */
  desktopColumns?: 2 | 3 | 4;
}
