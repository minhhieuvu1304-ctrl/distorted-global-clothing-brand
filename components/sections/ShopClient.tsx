'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import type { Product } from '@/lib/shopify';

/**
 * ShopClient
 *
 * Client-side composition for the shop page.
 *
 * History note: previous versions of this component rendered a
 * filter bar (ALL · HOODIES · SHIRTS · HATS · BELTS) with URL state
 * (`?category=hoodies`). The filter bar was removed at client
 * request — the shop now shows every product, all the time.
 *
 * The underlying data layer still supports filtering — products
 * have a `category` field, and `fetchProductsByCategory` still
 * exists in /lib/shopify. The category config block in
 * /config/site.config.ts is also preserved but unused in code.
 * If the client ever wants the filter bar back, restoring it is
 * a focused edit (see git history for the prior version).
 *
 * What this component still owns:
 *   - The PDP modal state, which lives as `?product=hoodie-no-03`
 *     in the URL. Opens with router.push so the browser back
 *     button closes the modal naturally. Closes with router.replace.
 *
 * What it no longer owns:
 *   - Filter selection state
 *   - Category-based product subsetting
 *   - The "no items match" empty state for empty filters (the only
 *     remaining empty state is "Catalog temporarily unavailable"
 *     when Shopify is unconfigured)
 */

interface ShopClientProps {
  products: Product[];
  unconfigured: boolean;
}

export function ShopClient({ products, unconfigured }: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const productHandle = searchParams.get('product');

  // Modal URL helpers — open uses push (back button closes modal),
  // close uses replace (avoids cluttering history with empty entries).
  const openProduct = useCallback(
    (handle: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('product', handle);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const closeProduct = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('product');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <>
      {/* Product grid — top padding compensates for the removed
          filter bar so the grid doesn't sit flush against the header. */}
      <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-12 md:px-6 md:pt-16">
        {unconfigured ? (
          <CatalogUnavailable />
        ) : products.length === 0 ? (
          <NoProducts />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={openProduct} />
            ))}
          </div>
        )}
      </div>

      {/* PDP modal — driven by ?product= URL param */}
      <ProductDetailModal
        handle={productHandle}
        onClose={closeProduct}
        onOpenProduct={openProduct}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Empty states
// ──────────────────────────────────────────────────────────────────────

/**
 * Catalog truly empty (Shopify returned zero products — either no
 * products in the store yet, or the API was reachable but the
 * response was empty). Different copy than CatalogUnavailable
 * because the catalog IS available, just bare.
 */
function NoProducts() {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4">
      <p className="font-serif text-[40px] text-paper md:text-[56px]">
        Nothing in the catalog yet.
      </p>
      <p className="font-sans text-[14px] text-mist">
        Check back soon.
      </p>
    </div>
  );
}

/**
 * Shopify unconfigured (env vars missing) or the API fetch failed.
 * The fetch helper logs the real reason server-side; UI stays generic.
 */
function CatalogUnavailable() {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4">
      <p className="font-serif text-[40px] text-paper md:text-[56px]">
        Catalog temporarily unavailable.
      </p>
      <p className="font-sans text-[14px] text-mist">
        Please try again shortly.
      </p>
    </div>
  );
}
