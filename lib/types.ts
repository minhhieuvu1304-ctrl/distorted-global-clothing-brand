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
