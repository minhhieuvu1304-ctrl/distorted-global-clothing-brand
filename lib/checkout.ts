// lib/checkout.ts
// Turns the items in the cart into a Shopify checkout URL.
// When there's no token, it returns a placeholder so you can still
// test the button — you'll see an alert instead of a real redirect.

import { shopifyFetch } from "./shopify";
import { CART_CREATE_MUTATION } from "./queries";
import { CartItem } from "./types";

interface CartCreateResponse {
  cartCreate: {
    cart: { id: string; checkoutUrl: string; totalQuantity: number } | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export async function createCheckout(items: CartItem[]): Promise<string> {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const lines = items.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
  }));

  const data = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    lines,
  });

  // No token yet → return a fake URL so the UI flow is still testable.
  if (!data) {
    return "#mock-checkout";
  }

  const { cart, userErrors } = data.cartCreate;

  if (userErrors.length > 0) {
    throw new Error(userErrors[0].message);
  }
  if (!cart) {
    throw new Error("Could not create checkout.");
  }

  return cart.checkoutUrl;
}
