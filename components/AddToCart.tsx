"use client";
// components/AddToCart.tsx
// Variant (size) picker + Add to cart button for the product detail page.
// This is a client component because it has interactive state.

import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variants = product.variants.edges.map((e) => e.node);

  // Default to the first variant that's actually in stock.
  const firstAvailable =
    variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);

  const selected = variants.find((v) => v.id === selectedId);
  const image = product.images.edges[0]?.node;

  function handleAdd() {
    if (!selected || !selected.availableForSale) return;

    addItem({
      variantId: selected.id,
      quantity: 1,
      productTitle: product.title,
      variantTitle: selected.title,
      price:
        selected.price?.amount ??
        product.priceRange.minVariantPrice.amount,
      currencyCode:
        selected.price?.currencyCode ??
        product.priceRange.minVariantPrice.currencyCode,
      image: image?.url ?? "",
      handle: product.handle,
    });
  }

  return (
    <div className="add-to-cart">
      {/* Size / variant selector — hidden if there's only one variant */}
      {variants.length > 1 && (
        <div className="add-to-cart__variants">
          <span className="add-to-cart__label">Size</span>
          <div className="add-to-cart__options">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                disabled={!v.availableForSale}
                className={
                  "variant-chip" +
                  (v.id === selectedId ? " variant-chip--active" : "") +
                  (!v.availableForSale ? " variant-chip--disabled" : "")
                }
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!selected?.availableForSale}
        className="add-to-cart__button"
      >
        {selected?.availableForSale ? "Add to cart" : "Sold out"}
      </button>
    </div>
  );
}
