"use client";
// context/CartContext.tsx
// Holds the cart in React state and shares it across the whole app.
// Wrap your app in <CartProvider> (in app/layout.tsx) and any component
// can call useCart() to read or change the cart.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CartItem } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalQuantity: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId);
      if (existing) {
        // Already in cart → bump the quantity.
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
    setIsOpen(true); // pop the drawer open on add
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalQuantity,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook used by components to talk to the cart.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return ctx;
}
