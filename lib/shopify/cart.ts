/**
 * Cart operations layer.
 *
 * Mirrors products.ts: thin wrappers around shopifyFetch + normalizers
 * from raw GraphQL → app-shaped `Cart`. Used by CartContext on the
 * client; not used during SSR (carts are user-specific, persisted in
 * localStorage, so they're fetched after hydration).
 *
 * Each operation returns the Cart on success or null on failure. The
 * CartContext reads null as "keep the previous cart state, surface a
 * non-blocking error" — never wipes the cart on a transient failure.
 */

import { shopifyFetch } from './client';
import {
  ADD_TO_CART_MUTATION,
  CREATE_CART_MUTATION,
  GET_CART_QUERY,
  REMOVE_FROM_CART_MUTATION,
  UPDATE_CART_MUTATION,
} from './queries';
import type {
  Cart,
  CartLineItem,
  ShopifyCart,
  ShopifyCartLine,
  ShopifyUserError,
} from './types';

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

/** Create an empty cart. Used on first visit when no cart ID is stored. */
export async function createCart(): Promise<Cart | null> {
  const result = await shopifyFetch<{
    cartCreate: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] };
  }>(CREATE_CART_MUTATION, { lines: [] });

  if (!result.ok) {
    logCartError('createCart', result.error);
    return null;
  }
  if (result.data.cartCreate.userErrors.length > 0) {
    logCartError('createCart', result.data.cartCreate.userErrors);
    return null;
  }
  if (!result.data.cartCreate.cart) return null;
  return normalizeCart(result.data.cartCreate.cart);
}

/**
 * Fetch an existing cart by ID. Returns null if the cart doesn't
 * exist (Shopify expires carts after ~10 days of inactivity) — the
 * CartContext treats null as "create a fresh cart".
 */
export async function getCart(cartId: string): Promise<Cart | null> {
  const result = await shopifyFetch<{ cart: ShopifyCart | null }>(
    GET_CART_QUERY,
    { cartId },
    // No long cache — cart contents must reflect the current user's
    // state immediately. We do allow the network layer to dedupe
    // concurrent identical requests within a render pass.
    { cache: 'no-store' }
  );

  if (!result.ok) {
    logCartError('getCart', result.error);
    return null;
  }
  if (!result.data.cart) return null;
  return normalizeCart(result.data.cart);
}

/**
 * Add a variant to the cart. `quantity` defaults to 1 — the spec'd
 * size selector + Add to Cart flow always adds a single unit; the
 * cart drawer is where qty changes happen.
 */
export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1
): Promise<Cart | null> {
  const result = await shopifyFetch<{
    cartLinesAdd: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] };
  }>(ADD_TO_CART_MUTATION, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });

  if (!result.ok) {
    logCartError('addToCart', result.error);
    return null;
  }
  if (result.data.cartLinesAdd.userErrors.length > 0) {
    logCartError('addToCart', result.data.cartLinesAdd.userErrors);
    return null;
  }
  return result.data.cartLinesAdd.cart
    ? normalizeCart(result.data.cartLinesAdd.cart)
    : null;
}

/**
 * Update quantity of an existing line item. Setting quantity to 0
 * does NOT remove the line — use `removeLineItem` for that. Shopify
 * itself rejects 0-quantity updates.
 */
export async function updateLineItem(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart | null> {
  const result = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCart | null;
      userErrors: ShopifyUserError[];
    };
  }>(UPDATE_CART_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  if (!result.ok) {
    logCartError('updateLineItem', result.error);
    return null;
  }
  if (result.data.cartLinesUpdate.userErrors.length > 0) {
    logCartError('updateLineItem', result.data.cartLinesUpdate.userErrors);
    return null;
  }
  return result.data.cartLinesUpdate.cart
    ? normalizeCart(result.data.cartLinesUpdate.cart)
    : null;
}

/** Remove a line item entirely. */
export async function removeLineItem(
  cartId: string,
  lineId: string
): Promise<Cart | null> {
  const result = await shopifyFetch<{
    cartLinesRemove: {
      cart: ShopifyCart | null;
      userErrors: ShopifyUserError[];
    };
  }>(REMOVE_FROM_CART_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  if (!result.ok) {
    logCartError('removeLineItem', result.error);
    return null;
  }
  if (result.data.cartLinesRemove.userErrors.length > 0) {
    logCartError('removeLineItem', result.data.cartLinesRemove.userErrors);
    return null;
  }
  return result.data.cartLinesRemove.cart
    ? normalizeCart(result.data.cartLinesRemove.cart)
    : null;
}

// ──────────────────────────────────────────────────────────────────────
// Normalization
// ──────────────────────────────────────────────────────────────────────

function normalizeCart(raw: ShopifyCart): Cart {
  const lines: CartLineItem[] = raw.lines.edges.map((e) =>
    normalizeLine(e.node)
  );
  return {
    id: raw.id,
    lines,
    subtotalCents: parseMoneyCents(raw.cost.subtotalAmount.amount),
    totalQuantity: raw.totalQuantity,
    checkoutUrl: raw.checkoutUrl,
  };
}

function normalizeLine(raw: ShopifyCartLine): CartLineItem {
  const m = raw.merchandise;
  return {
    id: raw.id,
    variantId: m.id,
    productHandle: m.product.handle,
    productTitle: m.product.title,
    variantTitle: m.title,
    image: m.image
      ? {
          src: m.image.url,
          alt: m.image.altText ?? m.product.title,
          width: m.image.width,
          height: m.image.height,
        }
      : null,
    quantity: raw.quantity,
    unitPriceCents: parseMoneyCents(raw.cost.amountPerQuantity.amount),
    lineTotalCents: parseMoneyCents(raw.cost.totalAmount.amount),
  };
}

function parseMoneyCents(amount: string): number {
  const num = Number.parseFloat(amount);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function logCartError(
  operation: string,
  detail: string | ShopifyUserError[]
): void {
  // eslint-disable-next-line no-console
  console.error(`[shopify cart] ${operation} failed:`, detail);
}
