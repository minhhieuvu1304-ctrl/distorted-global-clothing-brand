/**
 * Shopify Storefront API GraphQL operations.
 *
 * These are plain template-literal strings — no codegen, no Apollo,
 * no Relay. The fetch helper in client.ts sends them to the Shopify
 * Storefront endpoint and we type the responses by hand against the
 * shapes in types.ts.
 *
 * Why no codegen: this layer touches ~10 operations total. The cost
 * of wiring up @graphql-codegen exceeds the benefit. If the surface
 * grows beyond ~25 operations, revisit.
 *
 * Field naming follows Storefront API 2024-10. The only fields
 * fetched are those actually used by the app (spec §5 + cart drawer);
 * adding fields here only when a new component needs them keeps
 * payloads small.
 */

// ──────────────────────────────────────────────────────────────────────
// Reusable fragments
// ──────────────────────────────────────────────────────────────────────

const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    productType
    tags
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          sku
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              image {
                url
                altText
                width
                height
              }
              product {
                handle
                title
              }
            }
          }
        }
      }
    }
  }
`;

// ──────────────────────────────────────────────────────────────────────
// PRODUCT QUERIES
// ──────────────────────────────────────────────────────────────────────

export const GET_ALL_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetAllProducts($first: Int = 100) {
    products(first: $first) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

/**
 * Products filtered by tag. Storefront API uses a query string syntax
 * for `products(query: ...)` — `tag:hoodies` matches any product
 * carrying that tag. Owner is responsible for tagging products
 * consistently in the Shopify admin.
 */
export const GET_PRODUCTS_BY_TAG_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProductsByTag($tag: String!, $first: Int = 100) {
    products(first: $first, query: $tag) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

// ──────────────────────────────────────────────────────────────────────
// CART QUERIES + MUTATIONS
// ──────────────────────────────────────────────────────────────────────

export const GET_CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENT}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
`;

export const CREATE_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation CreateCart($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ADD_TO_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation UpdateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const REMOVE_FROM_CART_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENT}
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;
