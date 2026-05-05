/**
 * Shopify Storefront API types — distorted.global.
 *
 * Two layers:
 *
 *   1. Raw GraphQL response shapes (`Shopify*` prefix). These mirror
 *      the GraphQL schema 1:1, including connection/edge wrappers and
 *      Money objects. Used only by the fetch + normalize layer in
 *      products.ts.
 *
 *   2. App-shaped types (no prefix). Flat, readable, and stable —
 *      what the rest of the app actually consumes. Connections are
 *      flattened, Money is reduced to numeric cents, and
 *      sold-out/category derivations are baked in at fetch time.
 *
 * Why the split: the Storefront GraphQL shape is not pleasant for UI
 * code (`product.images.edges[0].node.url`), and decoupling now means
 * a future schema change only touches normalization, not components.
 *
 * Spec reference: §5 (Shop Page) for the fields the app actually
 * needs at the card / PDP level.
 */

// ──────────────────────────────────────────────────────────────────────
// APP-SHAPED TYPES (the surface most code touches)
// ──────────────────────────────────────────────────────────────────────

/**
 * Locked category set per spec §5 filter bar:
 *   ALL · HOODIES · SHIRTS · HATS · BELTS
 *
 * The 'all' pseudo-category is handled at the page level (no filter
 * applied); this type covers the real underlying categories.
 *
 * These match the slugs in `siteConfig.shop.categories` and are
 * expected to appear as Shopify product tags (e.g. `category:hoodie`)
 * or as the `productType` field. See `categoryFromShopifyTags()` in
 * products.ts for the resolution logic.
 */
export type ProductCategory = 'hoodie' | 'shirt' | 'hat' | 'belt';

export interface ProductImage {
  /** Cloudflare-CDN-served Shopify URL. */
  src: string;
  /** Alt text — auto-pulled from Shopify per spec §13 a11y. */
  alt: string;
  /** Intrinsic width in px — used by next/image. */
  width: number;
  /** Intrinsic height in px. */
  height: number;
}

export interface ProductVariant {
  /** Storefront API global ID, e.g. `gid://shopify/ProductVariant/123`. */
  id: string;
  /** Variant title — typically the size, e.g. "M". */
  title: string;
  /** Parsed size — narrowed when the variant title is a known size. */
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | string;
  availableForSale: boolean;
  /** Price in USD cents. We normalize Money → integer cents at fetch. */
  priceCents: number;
}

export interface Product {
  /** Storefront global ID. */
  id: string;
  /** URL slug, e.g. "hoodie-no-03". Used in `/shop?product=...`. */
  handle: string;
  /** Display name — Bodoni sentence case per spec §5. */
  title: string;
  /** Short description — Inter 14px in PDP. */
  description: string;
  /** Item number used in PDP header (Inter caption). Derived from
   *  Shopify SKU or a `item-no:NN` tag if present. */
  itemNumber: string;
  /** Resolved category — `null` when no recognized tag/type matches.
   *  Products without a category are still listed under "All". */
  category: ProductCategory | null;
  /** Min price in USD cents, formatted via `formatPrice()` for display. */
  priceCents: number;
  /** All available product images (gallery). First is the primary card image. */
  images: ProductImage[];
  /** Variants — typically one per size. */
  variants: ProductVariant[];
  /** Computed at fetch time — true if every variant is unavailable
   *  OR product carries the `manual-soldout` tag (spec §5). */
  isSoldOut: boolean;
  /** Raw Shopify tags — kept for category resolution and downstream filters. */
  tags: string[];
}

// ──────────────────────────────────────────────────────────────────────
// CART
// ──────────────────────────────────────────────────────────────────────

export interface CartLineItem {
  /** Cart line ID (different from variant ID). Used for update/remove ops. */
  id: string;
  /** Reference to the underlying variant. */
  variantId: string;
  /** Product handle for navigation links. */
  productHandle: string;
  /** Display name — Bodoni in drawer. */
  productTitle: string;
  /** Variant title — typically the size. */
  variantTitle: string;
  /** Thumbnail image for drawer row. */
  image: ProductImage | null;
  quantity: number;
  /** Per-line unit price in USD cents. */
  unitPriceCents: number;
  /** Line total in cents (unit × qty). */
  lineTotalCents: number;
}

export interface Cart {
  /** Cart ID (persists in localStorage so cart survives reloads). */
  id: string;
  lines: CartLineItem[];
  /** Sum of all line totals in cents. */
  subtotalCents: number;
  /** Total quantity across all lines — what the nav badge displays. */
  totalQuantity: number;
  /** Shopify-hosted checkout URL — used by the CHECKOUT button. */
  checkoutUrl: string;
}

// ──────────────────────────────────────────────────────────────────────
// RAW SHOPIFY GraphQL RESPONSE SHAPES (internal — used only in normalization)
// ──────────────────────────────────────────────────────────────────────

interface ShopifyMoney {
  amount: string; // decimal string, e.g. "420.00"
  currencyCode: string; // "USD"
}

interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ShopifyConnection<T> {
  edges: Array<{ node: T }>;
}

interface ShopifySelectedOption {
  name: string;
  value: string;
}

interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  selectedOptions: ShopifySelectedOption[];
  sku: string | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  images: ShopifyConnection<ShopifyImage>;
  variants: ShopifyConnection<ShopifyProductVariant>;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
    amountPerQuantity: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    image: ShopifyImage | null;
    product: {
      handle: string;
      title: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
  };
  lines: ShopifyConnection<ShopifyCartLine>;
}

// User-error shape returned by Storefront mutations (cartCreate, etc.).
export interface ShopifyUserError {
  field: string[] | null;
  message: string;
}
