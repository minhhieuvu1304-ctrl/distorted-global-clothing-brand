// lib/checkout.ts
// Turns the items in the cart into a Shopify checkout URL.
// When there's no token (or the request fails), it returns a placeholder
// so you can still test the button — you'll see an alert instead of a
// real redirect.

import { shopifyFetch } from './shopify/client';
import { CART_CREATE_MUTATION } from './queries';
import type { CartItem } from './types';

interface CartCreateResponse {
  cartCreate: {
    cart: { id: string; checkoutUrl: string; totalQuantity: number } | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export async function createCheckout(items: CartItem[]): Promise<string> {
  if (items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const lines = items.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
  }));

  // shopifyFetch returns a ShopifyResult<T> discriminated union:
  //   { ok: true, data: T } on success
  //   { ok: false, reason, error } when unconfigured / network / graphql
  // We treat the failure branch the same way the previous version
  // treated a `null` return — fall back to the mock checkout URL so
  // the UI flow is still testable without real Shopify credentials.
  const result = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    lines,
  });

  if (!result.ok) {
    return '#mock-checkout';
  }

  const { cart, userErrors } = result.data.cartCreate;

  if (userErrors.length > 0) {
    throw new Error(userErrors[0].message);
  }
  if (!cart) {
    throw new Error('Could not create checkout.');
  }

  return cart.checkoutUrl;
}
