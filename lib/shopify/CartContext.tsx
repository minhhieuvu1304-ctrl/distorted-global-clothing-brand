'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  addToCart as addToCartApi,
  createCart,
  getCart,
  removeLineItem as removeLineItemApi,
  updateLineItem as updateLineItemApi,
} from './cart';
import { isShopifyConfigured } from './client';
import type { Cart } from './types';

/**
 * CartContext
 *
 * Single source of truth for cart state across the site.
 *
 * Responsibilities:
 *   - Hold the current Cart (or null while booting / when API is down).
 *   - Persist cart ID to localStorage so the cart survives page reloads
 *     (spec §9: "client-side via Shopify cart API, persisted in localStorage").
 *   - Expose mutation methods that route through Shopify and update
 *     state in one shot.
 *   - Track drawer open/close state. The cart drawer auto-opens after
 *     a successful add-to-cart (spec §5).
 *
 * Boot sequence:
 *   1. Read cart ID from localStorage.
 *   2. If found, fetch that cart. If it 404s (Shopify expired it),
 *      drop the stored ID and create a fresh cart.
 *   3. If not found, create a fresh cart.
 *   4. Persist the cart ID.
 *
 * If Shopify isn't configured (missing env vars), we skip all of
 * this and stay in `cart: null` forever — UI components render their
 * empty/disabled states gracefully.
 *
 * Mutation strategy: pessimistic, not optimistic. We wait for the
 * Shopify response before updating local state. Optimistic updates
 * would feel snappier but bring rollback complexity that isn't
 * worth it for a low-volume luxury catalog (the locked tone is
 * "considered, not snappy" anyway).
 */

const STORAGE_KEY = 'distorted:cartId';

interface CartContextValue {
  /** Current cart, or null while booting / when Shopify is unconfigured. */
  cart: Cart | null;
  /** True during the initial boot fetch — UI can show a placeholder. */
  loading: boolean;
  /** True if Shopify env vars are missing entirely. */
  unconfigured: boolean;
  /** Whether the cart drawer is currently open. */
  isCartOpen: boolean;
  /**
   * True when the current open was triggered by an add-to-cart
   * action (vs. manual nav click). CartDrawer uses this to decide
   * whether the 4s auto-close timer should fire.
   */
  openedByAddToCart: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Add a variant to the cart. Opens drawer on success. */
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  /** Update an existing line's quantity. Setting to 0 removes the line. */
  updateLineItem: (lineId: string, quantity: number) => Promise<void>;
  /** Remove a line item entirely. */
  removeLineItem: (lineId: string) => Promise<void>;
  /** Total quantity across all lines — what the nav badge displays. */
  cartCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  /**
   * Tracks whether the drawer was opened by an add-to-cart action
   * (vs. a manual nav-icon click). The CartDrawer reads this to
   * decide whether the 4s auto-close timer should fire — manual
   * opens stay open until the user dismisses them, per the spec's
   * implicit UX (a user browsing their cart shouldn't have it
   * yank itself shut after 4 seconds).
   */
  const [openedByAddToCart, setOpenedByAddToCart] = useState(false);
  const unconfigured = !isShopifyConfigured();

  // Boot — once per mount. Wrapped in a ref guard against React 18
  // strict-mode double-invocation, which would otherwise create two
  // empty carts on first paint in dev.
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    if (unconfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        const storedId = localStorage.getItem(STORAGE_KEY);

        if (storedId) {
          const existing = await getCart(storedId);
          if (cancelled) return;
          if (existing) {
            setCart(existing);
            setLoading(false);
            return;
          }
          // Cart expired or invalid — drop the ID and fall through
          // to creating a fresh one.
          localStorage.removeItem(STORAGE_KEY);
        }

        const fresh = await createCart();
        if (cancelled) return;
        if (fresh) {
          localStorage.setItem(STORAGE_KEY, fresh.id);
          setCart(fresh);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [unconfigured]);

  // ────────────────────────────────────────────────────────────────────
  // Drawer open/close
  // ────────────────────────────────────────────────────────────────────
  const openCart = useCallback(() => {
    setOpenedByAddToCart(false);
    setIsCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // ────────────────────────────────────────────────────────────────────
  // Mutations
  // ────────────────────────────────────────────────────────────────────

  const addToCart = useCallback<CartContextValue['addToCart']>(
    async (variantId, quantity = 1) => {
      if (!cart) return;
      const updated = await addToCartApi(cart.id, variantId, quantity);
      if (updated) {
        setCart(updated);
        // Spec §5: cart drawer slides in on add. Mark this open as
        // add-to-cart-triggered so the 4s auto-close timer fires.
        setOpenedByAddToCart(true);
        setIsCartOpen(true);
      }
    },
    [cart]
  );

  const updateLineItem = useCallback<CartContextValue['updateLineItem']>(
    async (lineId, quantity) => {
      if (!cart) return;
      // Treat qty=0 as a remove — matches user intent in cart UIs and
      // sidesteps Shopify's rejection of 0-quantity updates.
      if (quantity <= 0) {
        const removed = await removeLineItemApi(cart.id, lineId);
        if (removed) setCart(removed);
        return;
      }
      const updated = await updateLineItemApi(cart.id, lineId, quantity);
      if (updated) setCart(updated);
    },
    [cart]
  );

  const removeLineItem = useCallback<CartContextValue['removeLineItem']>(
    async (lineId) => {
      if (!cart) return;
      const updated = await removeLineItemApi(cart.id, lineId);
      if (updated) setCart(updated);
    },
    [cart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      unconfigured,
      isCartOpen,
      openedByAddToCart,
      openCart,
      closeCart,
      addToCart,
      updateLineItem,
      removeLineItem,
      cartCount: cart?.totalQuantity ?? 0,
    }),
    [
      cart,
      loading,
      unconfigured,
      isCartOpen,
      openedByAddToCart,
      openCart,
      closeCart,
      addToCart,
      updateLineItem,
      removeLineItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Consume cart state. Throws if used outside <CartProvider> — that's
 * a programmer error, not a runtime condition, so a thrown error is
 * the right signal.
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart() must be used inside <CartProvider>.');
  }
  return ctx;
}
