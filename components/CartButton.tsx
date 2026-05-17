"use client";
// components/CartButton.tsx
// Put this in your site header. Shows a live count and opens the drawer.

import { useCart } from "@/context/CartContext";

export default function CartButton() {
  const { totalQuantity, openCart } = useCart();

  return (
    <button onClick={openCart} className="cart-button" aria-label="Open cart">
      Bag
      {totalQuantity > 0 && (
        <span className="cart-button__count">{totalQuantity}</span>
      )}
    </button>
  );
}
