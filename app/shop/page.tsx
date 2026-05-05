import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/sections/ShopClient';
import { fetchAllProducts, isShopifyConfigured } from '@/lib/shopify';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Shop',
  description: `Shop the ${siteConfig.shop.headline} collection — luxury cut & sew with darker streetwear sensibility.`,
};

/**
 * /shop — catalog page.
 *
 * Spec §5 + Prompt 5.
 *
 * Server component: fetches the full product list (cached 60s via the
 * fetch wrapper's `next.revalidate`) and hands it to ShopClient for
 * filter/modal URL state management. The fetch is small (~50 products
 * v1 scale per spec) and Shopify image URLs are CDN-served; client-
 * side filtering is faster than per-filter network round trips.
 *
 * The header is rendered here (server) since it's static content from
 * siteConfig — no need to ship it through the client boundary.
 *
 * Suspense boundary wraps ShopClient because it uses useSearchParams,
 * which Next 14 requires to be inside a Suspense boundary at the
 * page level for proper streaming.
 */

export const revalidate = 60;

export default async function ShopPage() {
  const products = await fetchAllProducts();
  const unconfigured = !isShopifyConfigured();

  return (
    <>
      {/* Header — solid ink, ~30vh, Bodoni headline. Top padding
          accounts for the fixed nav (h-16 mobile / h-20 desktop). */}
      <header
        aria-label="Shop"
        className="flex min-h-[30vh] items-end bg-ink pt-24 md:pt-32"
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-6 md:pb-16">
          <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-[-0.01em] text-paper md:text-[64px] lg:text-[72px]">
            {siteConfig.shop.headline}
          </h1>
        </div>
      </header>

      <Suspense fallback={<ShopFallback />}>
        <ShopClient products={products} unconfigured={unconfigured} />
      </Suspense>
    </>
  );
}

/**
 * Suspense fallback — renders empty filter row + a 4-card skeleton.
 * Real loading is fast since data is fetched server-side; this only
 * shows during the brief moment before useSearchParams hydrates.
 */
function ShopFallback() {
  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-6 md:py-12">
        <div className="h-4 w-72 bg-smoke" aria-hidden="true" />
      </div>
      <div className="mx-auto max-w-[1440px] px-4 pb-32 md:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/2] w-full bg-smoke" />
              <div className="h-5 w-3/4 bg-smoke" />
              <div className="h-4 w-16 bg-smoke" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
