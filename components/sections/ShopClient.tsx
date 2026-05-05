'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { siteConfig } from '@/config/site.config';
import type { Product } from '@/lib/shopify';
import { cn } from '@/lib/cn';

/**
 * ShopClient
 *
 * Client-side composition for the shop page (Prompt 5 §1, §2, §6).
 *
 * Owns:
 *   - The filter state, which lives in the URL as `?category=hoodies`.
 *     Switching filters does a `replace` (not `push`) so the back
 *     button leaves the shop instead of cycling through filters —
 *     the spec wants this filter row to feel like an in-page UI
 *     control, not navigation.
 *
 *   - The modal state, which lives as `?product=hoodie-no-03`.
 *     Both can coexist: `?category=hoodies&product=hoodie-no-03`.
 *     Modal close clears just `?product`, leaving filter intact.
 *
 *   - Filtering logic. We receive the full product list from the
 *     server-rendered page and filter client-side based on the URL
 *     param. The full list is small enough (50ish products at v1
 *     scale) that this is faster than per-filter network round trips,
 *     and it makes filter switching instant. If the catalog grows
 *     past ~200 products, switch to per-category fetch.
 *
 * Empty states:
 *   - All products + Shopify unconfigured → empty Bodoni "Catalog
 *     temporarily unavailable" message.
 *   - Filter applied with no matches → "No items match" + clear link.
 */

interface ShopClientProps {
  products: Product[];
  unconfigured: boolean;
}

export function ShopClient({ products, unconfigured }: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSlug = searchParams.get('category') ?? 'all';
  const productHandle = searchParams.get('product');

  // Build the URL for switching filter — preserves any other params
  // (e.g. an open modal). Setting `category=all` removes the param.
  const buildFilterUrl = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === 'all') params.delete('category');
      else params.set('category', slug);
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  const setFilter = useCallback(
    (slug: string) => {
      router.replace(buildFilterUrl(slug), { scroll: false });
    },
    [router, buildFilterUrl]
  );

  // Modal URL helpers — same pattern as useModalRoute but defined
  // inline here so we share the same searchParams snapshot with the
  // filter logic (avoids two competing reads).
  //
  // Open uses push so the browser back button closes the modal
  // (returning to the prior URL state — typically the filter). Close
  // uses replace so it doesn't accumulate empty entries when the user
  // dismisses via × or ESC.
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

  // Resolve the active filter to its singular ProductCategory for
  // client-side matching against `product.category`.
  const activeFilter = useMemo(() => {
    return (
      siteConfig.shop.categories.find((c) => c.slug === activeSlug) ??
      siteConfig.shop.categories[0] // 'all' fallback
    );
  }, [activeSlug]);

  // Filtered products. 'all' (category null) returns everything;
  // other categories match the singular `category` field that the
  // normalization layer set in /lib/shopify/products.ts.
  const filtered = useMemo(() => {
    if (!activeFilter || activeFilter.category === null) return products;
    return products.filter((p) => p.category === activeFilter.category);
  }, [products, activeFilter]);

  return (
    <>
      {/* Filter bar */}
      <FilterBar activeSlug={activeSlug} onChange={setFilter} />

      {/* Product grid / empty states */}
      <div className="mx-auto max-w-[1440px] px-4 pb-32 md:px-6">
        {unconfigured ? (
          <CatalogUnavailable />
        ) : filtered.length === 0 ? (
          <NoMatches onClear={() => setFilter('all')} />
        ) : (
          <div
            className={cn(
              'grid gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-12',
              'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
            )}
          >
            {filtered.map((p) => (
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
// Filter bar
// ──────────────────────────────────────────────────────────────────────

interface FilterBarProps {
  activeSlug: string;
  onChange: (slug: string) => void;
}

function FilterBar({ activeSlug, onChange }: FilterBarProps) {
  return (
    <nav
      aria-label="Filter products"
      className="mx-auto max-w-[1440px] px-4 py-8 md:px-6 md:py-12"
    >
      <ul
        // Mobile: horizontal scroll if categories overflow the row.
        // Desktop: simple inline list, left-aligned per spec.
        className="flex gap-6 overflow-x-auto md:gap-8 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {siteConfig.shop.categories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <li key={cat.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => onChange(cat.slug)}
                aria-pressed={active}
                className={cn(
                  'font-sans text-[12px] uppercase tracking-[0.08em]',
                  'transition-colors duration-300 ease-out',
                  // Active: paper color + 1px underline with 4px offset
                  active
                    ? 'text-paper underline decoration-paper underline-offset-[4px]'
                    : 'text-steel hover:text-mist'
                )}
              >
                {cat.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Empty states
// ──────────────────────────────────────────────────────────────────────

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4">
      <p className="font-display text-[40px] text-paper md:text-[56px]">
        No items match.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="font-sans text-[13px] uppercase tracking-[0.06em] text-paper underline-offset-[4px] hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

function CatalogUnavailable() {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4">
      <p className="font-display text-[40px] text-paper md:text-[56px]">
        Catalog temporarily unavailable.
      </p>
      <p className="font-sans text-[14px] text-mist">
        Please try again shortly.
      </p>
    </div>
  );
}
