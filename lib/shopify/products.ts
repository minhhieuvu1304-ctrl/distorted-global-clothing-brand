/**
 * Product fetching + normalization layer.
 *
 * Sits between the raw GraphQL client and the app's UI components:
 *   - Calls the right query
 *   - Normalizes connection-wrapped responses into flat arrays
 *   - Computes derived fields (sold-out, item number, category)
 *   - Returns app-shaped `Product` types — never raw `ShopifyProduct`
 *
 * Returns `[]` (or `null` for single-product fetches) when Shopify is
 * unconfigured or unreachable, per Prompt 3 §10. The caller decides
 * whether to render an empty state, a "Catalog temporarily unavailable"
 * message, or a 404. Errors are logged via console.error for ops
 * visibility but never thrown.
 */

import { shopifyFetch } from './client';
import {
  GET_ALL_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_BY_TAG_QUERY,
} from './queries';
import type {
  Product,
  ProductCategory,
  ProductImage,
  ProductVariant,
  ShopifyProduct,
} from './types';

// ──────────────────────────────────────────────────────────────────────
// Public fetchers
// ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all products. Returns `[]` on any failure path so consumers
 * can render empty states without conditionals.
 */
export async function fetchAllProducts(limit = 100): Promise<Product[]> {
  const result = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProduct }> };
  }>(
    GET_ALL_PRODUCTS_QUERY,
    { first: limit },
    // Cache for 60s — product data is the most-fetched thing on the
    // site; this avoids hammering Shopify on every page load. ISR
    // tags lets us bust the cache from a webhook later if needed.
    { next: { revalidate: 60, tags: ['products'] } }
  );

  if (!result.ok) {
    logFetchError('fetchAllProducts', result);
    return [];
  }

  return result.data.products.edges.map((e) => normalizeProduct(e.node));
}

/** Single product by handle — null if not found or fetch failed. */
export async function fetchProductByHandle(
  handle: string
): Promise<Product | null> {
  const result = await shopifyFetch<{ product: ShopifyProduct | null }>(
    GET_PRODUCT_BY_HANDLE_QUERY,
    { handle },
    { next: { revalidate: 60, tags: ['products', `product:${handle}`] } }
  );

  if (!result.ok) {
    logFetchError(`fetchProductByHandle(${handle})`, result);
    return null;
  }

  return result.data.product ? normalizeProduct(result.data.product) : null;
}

/**
 * Fetch products in a category. We rely on Shopify product tags
 * matching the category slug (e.g. tag `hoodie` for the hoodies
 * filter). Owner is responsible for tagging consistently.
 *
 * Note: the Storefront `query` arg uses Shopify's search syntax —
 * `tag:hoodie` matches products with that tag. Multiple tags can be
 * combined with `AND`/`OR` if needed.
 */
export async function fetchProductsByCategory(
  category: ProductCategory,
  limit = 100
): Promise<Product[]> {
  const result = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProduct }> };
  }>(
    GET_PRODUCTS_BY_TAG_QUERY,
    { tag: `tag:${category}`, first: limit },
    { next: { revalidate: 60, tags: ['products', `category:${category}`] } }
  );

  if (!result.ok) {
    logFetchError(`fetchProductsByCategory(${category})`, result);
    return [];
  }

  return result.data.products.edges.map((e) => normalizeProduct(e.node));
}

/**
 * Spec §5: sold-out detection.
 *   "All variants unavailable" OR `manual-soldout` tag override.
 *
 * Exposed as a free function (not just a method on Product) so it can
 * be called against either a normalized Product or a raw ShopifyProduct
 * during normalization itself. The duplication is intentional — keeps
 * the predicate readable at call sites.
 */
export function isProductSoldOut(
  product: Pick<Product, 'variants' | 'tags'>
): boolean {
  if (product.tags.includes('manual-soldout')) return true;
  if (product.variants.length === 0) return true;
  return product.variants.every((v) => !v.availableForSale);
}

/**
 * Related products — same category, excluding the current product.
 * Used by the PDP "You may also like" mini-grid (spec §5).
 *
 * If the current product has no resolved category, we fall back to
 * "any other product" rather than returning nothing — better than an
 * empty grid on the PDP.
 */
export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const pool = product.category
    ? await fetchProductsByCategory(product.category, limit + 1)
    : await fetchAllProducts(limit + 1);

  return pool.filter((p) => p.id !== product.id).slice(0, limit);
}

// ──────────────────────────────────────────────────────────────────────
// Normalization (raw GraphQL → app shape)
// ──────────────────────────────────────────────────────────────────────

function normalizeProduct(raw: ShopifyProduct): Product {
  const images: ProductImage[] = raw.images.edges.map((e) => ({
    src: e.node.url,
    alt: e.node.altText ?? raw.title,
    width: e.node.width,
    height: e.node.height,
  }));

  const variants: ProductVariant[] = raw.variants.edges.map((e) => {
    const sizeOption = e.node.selectedOptions.find(
      (o) => o.name.toLowerCase() === 'size'
    );
    return {
      id: e.node.id,
      title: e.node.title,
      size: sizeOption?.value ?? e.node.title,
      availableForSale: e.node.availableForSale,
      priceCents: parseMoneyCents(e.node.price.amount),
    };
  });

  const category = resolveCategory(raw.tags, raw.productType);
  const itemNumber = resolveItemNumber(raw);

  const isSoldOut = isProductSoldOut({ variants, tags: raw.tags });

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    itemNumber,
    category,
    priceCents: parseMoneyCents(raw.priceRange.minVariantPrice.amount),
    images,
    variants,
    isSoldOut,
    tags: raw.tags,
  };
}

/**
 * Money parsing. Shopify returns amounts as decimal strings ("420.00")
 * — we convert to integer cents to avoid float math throughout the app.
 * Rounded to handle currencies/responses with minor precision artifacts.
 */
function parseMoneyCents(amount: string): number {
  const num = Number.parseFloat(amount);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Resolve the locked category set from Shopify metadata.
 *
 * Resolution order (most → least specific):
 *   1. Tag matching the category slug ("hoodie", "shirt", "hat", "belt").
 *   2. Tag matching the plural form ("hoodies", "shirts", ...) — common
 *      in Shopify admin habits.
 *   3. productType field, normalized to lowercase singular.
 *
 * Returns null when nothing matches — these products still appear in
 * the "All" filter but won't show up under any category-specific filter.
 */
function resolveCategory(
  tags: string[],
  productType: string
): ProductCategory | null {
  const TAG_MAP: Record<string, ProductCategory> = {
    hoodie: 'hoodie',
    hoodies: 'hoodie',
    shirt: 'shirt',
    shirts: 'shirt',
    hat: 'hat',
    hats: 'hat',
    belt: 'belt',
    belts: 'belt',
  };

  for (const tag of tags) {
    const norm = tag.trim().toLowerCase();
    if (norm in TAG_MAP) return TAG_MAP[norm]!;
  }

  const typeNorm = productType.trim().toLowerCase();
  if (typeNorm in TAG_MAP) return TAG_MAP[typeNorm]!;

  return null;
}

/**
 * Item number — Inter caption above product name in PDP (spec §5).
 *
 * Resolution order:
 *   1. Tag prefixed `item-no:` (e.g. `item-no:NO.03` → "NO.03").
 *   2. SKU of the first variant — pragmatic fallback.
 *   3. Empty string — PDP component should hide the line in this case.
 */
function resolveItemNumber(raw: ShopifyProduct): string {
  const tagged = raw.tags.find((t) => t.toLowerCase().startsWith('item-no:'));
  if (tagged) return tagged.slice('item-no:'.length).trim();

  const firstVariantSku = raw.variants.edges[0]?.node.sku;
  if (firstVariantSku) return firstVariantSku;

  return '';
}

// ──────────────────────────────────────────────────────────────────────
// Error logging
// ──────────────────────────────────────────────────────────────────────

function logFetchError(
  operation: string,
  result: { ok: false; reason: string; error: string }
): void {
  // 'unconfigured' is the expected state during initial dev before
  // env vars are set — log it at info level, not error, to avoid
  // alarming console output during scaffolding work.
  if (result.reason === 'unconfigured') {
    // eslint-disable-next-line no-console
    console.info(
      `[shopify] ${operation}: skipped (Shopify not configured). ` +
        'Catalog will render an empty state until .env.local is set.'
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.error(
    `[shopify] ${operation} failed (${result.reason}):`,
    result.error
  );
}
