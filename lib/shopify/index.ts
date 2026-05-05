/**
 * Shopify integration barrel — single import surface.
 *
 *   import {
 *     CartProvider, useCart,
 *     fetchAllProducts, fetchProductByHandle,
 *     formatPrice,
 *   } from '@/lib/shopify';
 *
 * Pages and components should never reach into ./client, ./queries,
 * or the raw Shopify* types. If a new operation is needed, add it
 * here as part of the public surface.
 */

// Public types
export type {
  Product,
  ProductVariant,
  ProductImage,
  ProductCategory,
  Cart,
  CartLineItem,
} from './types';

// Configuration check + display utilities
export { isShopifyConfigured, formatPrice } from './client';

// Product fetching
export {
  fetchAllProducts,
  fetchProductByHandle,
  fetchProductsByCategory,
  isProductSoldOut,
  getRelatedProducts,
} from './products';

// Cart provider + hook
export { CartProvider, useCart } from './CartContext';
