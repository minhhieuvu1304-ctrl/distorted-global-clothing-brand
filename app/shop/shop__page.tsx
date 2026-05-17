// app/shop/page.tsx
// The product listing page. This is a server component — it fetches
// products on the server (mock now, real Shopify later) and renders the grid.

import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Shop — Distorted Global",
  description: "Browse the full Distorted Global collection.",
};

// Re-fetch product data every 60 seconds (ISR).
export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main className="shop">
      <header className="shop__header">
        <h1 className="shop__title">All Products</h1>
        <p className="shop__count">{products.length} items</p>
      </header>

      {products.length === 0 ? (
        <p className="shop__empty">No products available right now.</p>
      ) : (
        <div className="shop__grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
