// app/products/[handle]/page.tsx
// The product detail page. The [handle] folder makes this a dynamic
// route — /products/distorted-tee-black, /products/distorted-hoodie-cream, etc.

import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/products";
import { formatMoney } from "@/lib/format";
import AddToCart from "@/components/AddToCart";

export const revalidate = 60;

// Pre-build a page for each product at build time.
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

// Per-product SEO metadata.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.title} — Distorted Global`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);

  // Unknown handle → Next.js 404 page.
  if (!product) notFound();

  const images = product.images.edges.map((e) => e.node);
  const price = product.priceRange.minVariantPrice;

  return (
    <main className="product">
      <div className="product__gallery">
        {images.map((img, i) => (
          <div key={i} className="product__image">
            <Image
              src={img.url}
              alt={img.altText ?? product.title}
              width={800}
              height={1000}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="product__details">
        <h1 className="product__title">{product.title}</h1>
        <p className="product__price">
          {formatMoney(price.amount, price.currencyCode)}
        </p>
        <div className="product__description">
          {product.descriptionHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : (
            <p>{product.description}</p>
          )}
        </div>

        {/* Variant picker + add to cart (client component) */}
        <AddToCart product={product} />
      </div>
    </main>
  );
}
