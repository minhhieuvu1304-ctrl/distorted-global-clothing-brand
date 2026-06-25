// lib/queries.ts
// ───────────────────────────────────────────────────────────────────
// Legacy GraphQL constants used by lib/checkout.ts.
//
// The newer cart flow lives at lib/shopify/* (with its own queries
// file at lib/shopify/queries.ts) and uses a richer cart shape via
// CartFields fragment. This file stays separate because checkout.ts
// only needs the minimal fields below (id, checkoutUrl, totalQuantity)
// to redirect customers to Shopify's hosted checkout. Untangling the
// two parallel cart implementations is a separate refactor task.
// ───────────────────────────────────────────────────────────────────

/**
 * Creates a Shopify cart from line items and returns just enough to
 * redirect to checkout. The returned `checkoutUrl` is the Shopify-
 * hosted page that handles payment. Used by lib/checkout.ts's
 * createCheckout() function — the entry point for the cart drawer's
 * "Checkout" button.
 */
export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;
