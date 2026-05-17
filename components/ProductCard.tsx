"use client";
// components/ProductCard.tsx
// A single product tile used in the shop grid.

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;

  // A product is "sold out" only if every variant is unavailable.
  const soldOut = product.variants.edges.every(
    (v) => !v.node.availableForSale
  );

  return (
    <Link href={`/products/${product.handle}`} className="product-card">
      <div className="product-card__image">
        {image && (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            width={800}
            height={1000}
            className="product-card__img"
          />
        )}
        {soldOut && <span className="product-card__badge">Sold out</span>}
      </div>
      <div className="product-card__meta">
        <h3 className="product-card__title">{product.title}</h3>
        <p className="product-card__price">
          {formatMoney(price.amount, price.currencyCode)}
        </p>
      </div>
    </Link>
  );
}
