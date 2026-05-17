"use client";
// components/CartDrawer.tsx
// Slide-in cart panel. Shows line items, lets you change quantities,
// and has the Checkout button that redirects to Shopify.

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { createCheckout } from "@/lib/checkout";
import { formatMoney } from "@/lib/format";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const url = await createCheckout(items);

      if (url === "#mock-checkout") {
        // No real token yet — just confirm the flow works.
        alert(
          "Mock checkout. Once the Shopify token is connected, this will " +
            "redirect to Shopify's real checkout page."
        );
        setLoading(false);
        return;
      }

      // Real redirect to Shopify's hosted checkout.
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Dark overlay behind the drawer */}
      <div
        className={"cart-overlay" + (isOpen ? " cart-overlay--open" : "")}
        onClick={closeCart}
      />

      <aside className={"cart-drawer" + (isOpen ? " cart-drawer--open" : "")}>
        <header className="cart-drawer__header">
          <h2>Your bag</h2>
          <button onClick={closeCart} className="cart-drawer__close">
            &times;
          </button>
        </header>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <p className="cart-drawer__empty">Your bag is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="cart-line">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.productTitle}
                    width={72}
                    height={90}
                    className="cart-line__img"
                  />
                )}
                <div className="cart-line__info">
                  <p className="cart-line__title">{item.productTitle}</p>
                  <p className="cart-line__variant">{item.variantTitle}</p>
                  <div className="cart-line__qty">
                    <button
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      &minus;
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-line__right">
                  <p className="cart-line__price">
                    {formatMoney(
                      parseFloat(item.price) * item.quantity,
                      item.currencyCode
                    )}
                  </p>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="cart-line__remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, items[0]?.currencyCode)}</span>
            </div>
            <p className="cart-drawer__note">
              Shipping & taxes calculated at checkout.
            </p>
            {error && <p className="cart-drawer__error">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="cart-drawer__checkout"
            >
              {loading ? "Preparing checkout…" : "Checkout"}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
