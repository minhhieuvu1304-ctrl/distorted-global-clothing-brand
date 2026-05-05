'use client';

import { CrossfadeImage } from '@/components/ui/CrossfadeImage';
import { formatPrice } from '@/lib/shopify';
import type { Product } from '@/lib/shopify';
import { cn } from '@/lib/cn';

/**
 * ProductCard
 *
 * Spec §5 product card (LOCKED) + Prompt 5 §2.
 *
 * Layout: image (3:2) → product name → price. No add-to-cart button
 * on cards — the spec deliberately forces clicks into the PDP modal
 * to slow visitors down (luxury pacing).
 *
 * Hover: primary→secondary image cross-fade via <CrossfadeImage />.
 * No scale on hover (per spec — that effect is reserved for lookbook).
 *
 * Sold-out treatment (spec §5): 50% ink overlay on image with a
 * centered "SOLD OUT" tag. Name + price stay at full opacity below.
 * Card is still clickable so the PDP can show notify-when-available.
 *
 * Click behavior is owned by the parent — we expose `onClick(handle)`
 * so the parent (ShopClient) can update the URL (`?product=HANDLE`)
 * via the useModalRoute hook. This avoids spreading URL state across
 * card instances.
 */

interface ProductCardProps {
  product: Product;
  onClick: (handle: string) => void;
  /**
   * Smaller variant for the "You may also like" mini-grid in the PDP.
   * Tightens type sizes to fit at quarter-width on desktop.
   */
  size?: 'default' | 'small';
  className?: string;
}

export function ProductCard({
  product,
  onClick,
  size = 'default',
  className,
}: ProductCardProps) {
  const primary = product.images[0];
  const secondary = product.images[1]; // optional — undefined is fine

  // Guard against products with no images at all (rare but possible
  // in test data). Render a placeholder rather than crashing.
  if (!primary) {
    return (
      <div className={cn('w-full', className)}>
        <div className="aspect-[3/2] w-full bg-smoke" aria-hidden="true" />
        <div className="mt-4">
          <p className="font-display text-paper">{product.title}</p>
          <p className="mt-1 font-sans text-[14px] text-mist">
            {formatPrice(product.priceCents)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(product.handle)}
      aria-label={`View ${product.title}`}
      className={cn(
        'group block w-full cursor-pointer text-left',
        'transition-opacity duration-300 ease-out',
        className
      )}
    >
      <div className="relative">
        <CrossfadeImage
          primary={primary}
          secondary={secondary}
          aspect="aspect-[3/2]"
          // Tighter sizes hint for the small variant since it renders
          // at ~quarter-width on desktop.
          sizes={
            size === 'small'
              ? '(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw'
              : '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'
          }
        />

        {/* Sold-out overlay */}
        {product.isSoldOut && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-ink/50"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  'border border-paper bg-transparent',
                  'px-4 py-2',
                  'font-sans text-[13px] uppercase tracking-[0.1em] text-paper'
                )}
              >
                Sold Out
              </span>
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="mt-4">
        <p
          className={cn(
            'font-display text-paper',
            size === 'small' ? 'text-[16px]' : 'text-[18px] md:text-[20px]'
          )}
        >
          {product.title}
        </p>
        <p
          className={cn(
            'mt-1 font-sans text-mist',
            size === 'small' ? 'text-[13px]' : 'text-[14px]'
          )}
        >
          {formatPrice(product.priceCents)}
        </p>
      </div>
    </button>
  );
}
