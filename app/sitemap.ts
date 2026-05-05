import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';
import { fetchAllProducts } from '@/lib/shopify';

/**
 * Sitemap — Next 14 native generator at /sitemap.xml.
 *
 * Static pages (homepage, shop, lookbook, contact, privacy) are
 * always included. Product detail pages are included as deep links
 * into the shop modal: `/shop?product=<handle>` is the canonical
 * shareable URL for any product.
 *
 * If Shopify is unconfigured (env vars missing), the dynamic product
 * URLs are simply omitted — the static routes still ship a valid
 * sitemap. fetchAllProducts() returns [] in that case.
 *
 * Vercel ISR-cache the sitemap for 24h via revalidate; product changes
 * propagate within a day. For faster propagation, owner can hit
 * the route once after publishing to revalidate on demand.
 */

export const revalidate = 86_400; // 24h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.meta.url;
  const now = new Date();

  // Static routes — change `priority` and `changeFrequency` here if
  // page importance shifts (e.g. shop becomes the primary landing).
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/shop`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/lookbook`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic — one entry per product. Shareable URL pattern matches
  // what ShopClient generates when a card is clicked.
  const products = await fetchAllProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop?product=${p.handle}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
