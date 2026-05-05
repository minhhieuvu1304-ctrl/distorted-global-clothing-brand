'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Lightbox, type LightboxImage } from '@/components/ui/Lightbox';
import { Input } from '@/components/ui/Input';
import { ProductCard } from './ProductCard';
import {
  fetchProductByHandle,
  formatPrice,
  getRelatedProducts,
  useCart,
} from '@/lib/shopify';
import type { Product, ProductVariant } from '@/lib/shopify';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/cn';

/**
 * ProductDetailModal
 *
 * Spec §5 PDP modal (LOCKED) + Prompt 5 §4.
 *
 * Driven by URL state — the parent (ShopClient) reads
 * `useModalRoute('product')` and passes the handle here. This component
 * is responsible for the full PDP UX once a handle is present:
 *
 *   1. Fetch the product by handle (and related products in parallel).
 *   2. Render gallery (left, scroll), info (right, sticky desktop).
 *   3. Size selector + add-to-cart, with sold-out branching.
 *   4. Three accordions (Story / Materials & Care / Shipping).
 *   5. "You may also like" mini-grid below info.
 *   6. Click any gallery image to open the <Lightbox> for zoom.
 *
 * Loading state shows a skeleton-ish empty body so the modal doesn't
 * pop in/out as data loads. Failure (product not found, fetch error)
 * shows an inline message — the modal stays open until the user dismisses.
 *
 * Sold-out PDP behavior:
 *   - Each variant button greyed + strikethrough when individually OOS.
 *   - When ALL variants are OOS: full Add to Cart button replaced with
 *     "NOTIFY ME WHEN AVAILABLE" → email-only inline form (stub).
 */

interface ProductDetailModalProps {
  /** Current product handle from URL, or null if no modal open. */
  handle: string | null;
  onClose: () => void;
  /** Open another product's PDP — used by related-products grid. */
  onOpenProduct: (handle: string) => void;
}

export function ProductDetailModal({
  handle,
  onClose,
  onOpenProduct,
}: ProductDetailModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Fetch when handle changes. Cancellation guard prevents an older
  // fetch from clobbering newer state if the user opens product B
  // before A's fetch resolves.
  useEffect(() => {
    if (!handle) {
      setProduct(null);
      setRelated([]);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      const found = await fetchProductByHandle(handle);
      if (cancelled) return;
      if (!found) {
        setProduct(null);
        setRelated([]);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(found);
      // Related products fire-and-forget — fetch error is non-blocking.
      const rel = await getRelatedProducts(found, 4);
      if (cancelled) return;
      setRelated(rel);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [handle]);

  return (
    <Modal
      open={!!handle}
      onClose={onClose}
      ariaLabel={product?.title ?? 'Product details'}
      maxWidth="max-w-[1400px]"
    >
      <div className="px-6 pb-12 pt-12 md:px-12 md:pt-16">
        {loading && !product && <PdpSkeleton />}
        {notFound && <PdpNotFound onClose={onClose} />}
        {product && (
          <PdpBody
            product={product}
            related={related}
            onOpenProduct={onOpenProduct}
          />
        )}
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────
// PDP body — the actual layout once product data has loaded
// ──────────────────────────────────────────────────────────────────────

interface PdpBodyProps {
  product: Product;
  related: Product[];
  onOpenProduct: (handle: string) => void;
}

function PdpBody({ product, related, onOpenProduct }: PdpBodyProps) {
  // Lightbox state — opens with a clicked image's index + originRect
  // for the scale-up animation.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxOrigin, setLightboxOrigin] = useState<DOMRect | null>(null);

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      product.images.map((img) => ({
        src: img.src,
        // The Shopify CDN supports `width` query params for resizing —
        // we pass the same src as both in-page and high-res for v1.
        // Prompt 6 (Lookbook) wires Cloudflare Images for proper variants.
        srcHighRes: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      })),
    [product.images]
  );

  // Schema.org Product JSON-LD for SEO (Prompt 10 §3). Emitted as
  // a script tag inside the modal — even though the modal is dynamic,
  // search crawlers that execute JS will pick this up when navigating
  // to /shop?product=<handle>.
  const productJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.images.map((img) => img.src),
      sku: product.itemNumber || undefined,
      brand: { '@type': 'Brand', name: 'Distorted' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: (product.priceCents / 100).toFixed(2),
        availability: product.isSoldOut
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      },
    }),
    [product]
  );

  const openLightbox = (index: number, e: React.MouseEvent<HTMLElement>) => {
    setLightboxOrigin(e.currentTarget.getBoundingClientRect());
    setLightboxIndex(index);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Two-column layout — gallery + sticky info on desktop */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-12 lg:gap-16">
        {/* LEFT: Image gallery */}
        <div className="space-y-6">
          {product.images.map((img, i) => (
            <button
              type="button"
              key={`${img.src}-${i}`}
              onClick={(e) => openLightbox(i, e)}
              aria-label={`Zoom ${img.alt}`}
              className="relative block aspect-[3/2] w-full overflow-hidden bg-smoke"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover"
                priority={i === 0}
              />
            </button>
          ))}
        </div>

        {/* RIGHT: Product info — sticky on desktop */}
        <div className="md:sticky md:top-12 md:self-start">
          <PdpInfo product={product} />
        </div>
      </div>

      {/* You may also like */}
      {related.length > 0 && (
        <div className="mt-24 border-t border-smoke pt-12 md:mt-32">
          <h3 className="mb-8 font-sans text-[11px] uppercase tracking-[0.1em] text-mist">
            You may also like
          </h3>
          <RelatedGrid products={related} onOpenProduct={onOpenProduct} />
        </div>
      )}

      {/* Lightbox overlays everything else when open */}
      <Lightbox
        open={lightboxIndex !== null}
        images={lightboxImages}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        originRect={lightboxOrigin}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// PDP info column — header / size / add-to-cart / accordions
// ──────────────────────────────────────────────────────────────────────

function PdpInfo({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [sizeError, setSizeError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const allSoldOut = product.isSoldOut;

  // Reset selection if product changes (modal navigated to another item)
  useEffect(() => {
    setSelectedVariantId(null);
    setSizeError(false);
    setJustAdded(false);
  }, [product.id]);

  async function handleAdd() {
    if (allSoldOut) return;
    if (!selectedVariantId) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setAdding(true);
    await addToCart(selectedVariantId, 1);
    setAdding(false);
    // Show "ADDED ✓" confirmation for 2s before reverting. The cart
    // drawer also slides in via CartContext side-effect — both
    // happen simultaneously per spec §5.
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Item number — Inter caption */}
      {product.itemNumber && (
        <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-steel">
          Item {product.itemNumber}
        </p>
      )}

      {/* Product name — Bodoni 28px sentence case */}
      <h2 className="font-display text-[28px] leading-tight text-paper">
        {product.title}
      </h2>

      {/* Price — Inter 16px paper */}
      <p className="font-sans text-[16px] text-paper">
        {formatPrice(product.priceCents)}
      </p>

      {/* Size selector — only when multiple variants exist */}
      {product.variants.length > 0 && (
        <SizeSelector
          variants={product.variants}
          selectedId={selectedVariantId}
          onSelect={(id) => {
            setSelectedVariantId(id);
            setSizeError(false);
          }}
          error={sizeError}
        />
      )}

      {/*
        Size guide — placeholder. Disabled until owner provides size
        chart data. When the data arrives, replace this with either an
        accordion expansion or a modal that displays a size table.
      */}
      <button
        type="button"
        disabled
        aria-label="Size guide (coming soon)"
        className="self-start font-sans text-[11px] uppercase tracking-[0.1em] text-mist underline-offset-[4px] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        Size guide
      </button>

      {/* Add to Cart / Notify when available */}
      {allSoldOut ? (
        <NotifyWhenAvailableForm
          productHandle={product.handle}
          variants={product.variants}
        />
      ) : (
        <AddToCartButton
          adding={adding}
          justAdded={justAdded}
          onClick={handleAdd}
        />
      )}

      {/* Short description — Inter 14px mist */}
      {product.description && (
        <p className="font-sans text-[14px] leading-relaxed text-mist">
          {product.description}
        </p>
      )}

      {/* Accordions */}
      <div className="mt-2">
        <Accordion title="Materials & Care">
          <p className="font-sans text-[14px] leading-relaxed text-mist">
            {/* Pulled from product description for now; spec §15 lists
                proper Materials & Care metafield as owner-supplied. */}
            {product.description ||
              'Materials and care details available on request.'}
          </p>
        </Accordion>
        <Accordion title="Shipping">
          <p className="font-sans text-[14px] leading-relaxed text-mist">
            {siteConfig.shipping.copy}
          </p>
        </Accordion>
        {/* Story accordion only when product has story content. The
            current Product type doesn't carry a story field yet —
            Prompt 8 widens the type once the metafield is wired. */}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Size selector
// ──────────────────────────────────────────────────────────────────────

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  error: boolean;
}

function SizeSelector({
  variants,
  selectedId,
  onSelect,
  error,
}: SizeSelectorProps) {
  return (
    <div>
      <fieldset>
        <legend className="mb-3 font-sans text-[11px] uppercase tracking-[0.1em] text-mist">
          Size
        </legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.id === selectedId;
            const oos = !v.availableForSale;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(v.id)}
                className={cn(
                  'min-w-[44px] border px-3 py-2',
                  'font-sans text-[13px] uppercase tracking-[0.04em]',
                  'transition-colors duration-300 ease-out',
                  selected
                    ? 'border-paper bg-paper text-ink'
                    : 'border-steel bg-transparent text-paper hover:border-paper',
                  // Out-of-stock — greyed + strikethrough. Still
                  // clickable so click triggers notify form (spec §5).
                  oos &&
                    !selected &&
                    'border-steel text-steel line-through hover:border-steel'
                )}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && (
        <p className="mt-2 font-sans text-caption text-alert" role="alert">
          Select a size
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Add to cart button
// ──────────────────────────────────────────────────────────────────────

interface AddToCartButtonProps {
  adding: boolean;
  justAdded: boolean;
  onClick: () => void;
}

function AddToCartButton({ adding, justAdded, onClick }: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={adding}
      className={cn(
        'w-full bg-paper text-ink',
        'font-sans text-[13px] font-medium uppercase tracking-[0.06em]',
        'py-4',
        'rounded-sm border border-paper',
        'transition-all duration-300 ease-out',
        'hover:bg-transparent hover:text-paper',
        'disabled:cursor-default disabled:opacity-70',
        justAdded && 'animate-soft-pulse'
      )}
      aria-live="polite"
    >
      {adding ? 'ADDING…' : justAdded ? 'ADDED ✓' : 'ADD TO CART'}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Notify when available — email-only form, posts to Klaviyo
// ──────────────────────────────────────────────────────────────────────

interface NotifyWhenAvailableFormProps {
  productHandle: string;
  variants: ProductVariant[];
}

/**
 * NotifyWhenAvailableForm
 *
 * Replaces the Add-to-Cart button when ALL variants are sold out.
 * Captures email + size (variant ID) and POSTs to the back-in-stock
 * API route, which calls Klaviyo's back-in-stock-subscriptions
 * endpoint (Prompt 8 §4).
 *
 * UX: variant must be selected first so we know WHICH variant to
 * register against — different sizes restock independently. If the
 * product has only one variant, it's auto-selected and the size
 * picker is hidden.
 */
function NotifyWhenAvailableForm({
  productHandle,
  variants,
}: NotifyWhenAvailableFormProps) {
  const [email, setEmail] = useState('');
  const [variantId, setVariantId] = useState<string | null>(
    variants.length === 1 ? (variants[0]?.id ?? null) : null
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setFormError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email.');
      return;
    }
    if (!variantId) {
      setFormError('Select a size.');
      return;
    }

    setSubmitting(true);
    let response: Response;
    try {
      response = await fetch('/api/klaviyo/back-in-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          productHandle,
          variantId,
        }),
      });
    } catch {
      setSubmitting(false);
      setFormError('Service temporarily unavailable. Please try again later.');
      return;
    }

    let json: { ok?: boolean; error?: string } = {};
    try {
      json = (await response.json()) as typeof json;
    } catch {
      // non-JSON — treated as generic failure below
    }
    setSubmitting(false);

    if (json.ok) {
      setSubmitted(true);
      return;
    }

    switch (json.error) {
      case 'invalid-email':
        setEmailError('Enter a valid email.');
        break;
      case 'rate-limited':
        setFormError('Too many requests. Please wait a moment.');
        break;
      case 'unconfigured':
      case 'unavailable':
        setFormError(
          'Service temporarily unavailable. Please try again later.'
        );
        break;
      default:
        setFormError('Something went wrong. Please try again.');
    }
  }

  if (submitted) {
    return (
      <p className="font-display text-[20px] text-paper" role="status">
        We&rsquo;ll notify you when it&rsquo;s back.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <p className="font-sans text-[13px] uppercase tracking-[0.08em] text-mist">
        Notify me when available
      </p>

      {/* Size picker — only when more than one variant exists */}
      {variants.length > 1 && (
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const selected = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setVariantId(v.id)}
                className={cn(
                  'min-w-[44px] border px-3 py-2',
                  'font-sans text-[13px] uppercase tracking-[0.04em]',
                  'transition-colors duration-300 ease-out',
                  selected
                    ? 'border-paper bg-paper text-ink'
                    : 'border-steel bg-transparent text-paper hover:border-paper'
                )}
              >
                {v.size}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-3">
        <Input
          variant="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          aria-label="Notify email"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          aria-label="Submit"
          className="shrink-0 border border-paper px-4 py-3 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink disabled:opacity-50"
        >
          {submitting ? '…' : '→'}
        </button>
      </div>

      {formError && (
        <p className="font-sans text-caption text-alert" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Accordion — collapsible section with smooth height transition
// ──────────────────────────────────────────────────────────────────────

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

function Accordion({ title, children }: AccordionProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  // Measure content height when it changes (responsive text wrapping
  // changes height). Keeps the smooth transition accurate.
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(() => {
      if (contentRef.current) setHeight(contentRef.current.scrollHeight);
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="border-t border-smoke last:border-b">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="font-display text-[16px] text-paper">{title}</span>
        <span
          aria-hidden="true"
          className={cn(
            'text-paper transition-transform duration-300 ease-out',
            open && 'rotate-45'
          )}
        >
          +
        </span>
      </button>
      <div
        // Animate max-height — measured rather than guessed so smooth
        // transition works for any content length.
        style={{
          maxHeight: open ? `${height}px` : '0px',
          transition: 'max-height 300ms ease-out',
        }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Related products grid (You may also like)
// ──────────────────────────────────────────────────────────────────────

function RelatedGrid({
  products,
  onOpenProduct,
}: {
  products: Product[];
  onOpenProduct: (handle: string) => void;
}) {
  return (
    <>
      {/* Desktop: 4-column grid */}
      <div className="hidden grid-cols-4 gap-6 md:grid">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={onOpenProduct}
            size="small"
          />
        ))}
      </div>
      {/* Mobile: horizontal scroll carousel — one of few places carousel
          is acceptable per spec §5. Each card is fixed width so the
          row scrolls naturally. */}
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-[70vw] shrink-0 snap-start">
            <ProductCard product={p} onClick={onOpenProduct} size="small" />
          </div>
        ))}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Skeleton + not-found states
// ──────────────────────────────────────────────────────────────────────

function PdpSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-12">
      <div className="space-y-6">
        <div className="aspect-[3/2] w-full bg-smoke" />
        <div className="aspect-[3/2] w-full bg-smoke" />
      </div>
      <div className="space-y-4">
        <div className="h-3 w-20 bg-smoke" />
        <div className="h-7 w-3/4 bg-smoke" />
        <div className="h-4 w-24 bg-smoke" />
        <div className="mt-8 h-12 w-full bg-smoke" />
      </div>
    </div>
  );
}

function PdpNotFound({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-6">
      <p className="font-display text-[40px] text-paper">Product not found.</p>
      <button
        type="button"
        onClick={onClose}
        className="font-sans text-[13px] uppercase tracking-[0.06em] text-paper underline-offset-[4px] hover:underline"
      >
        Back to shop
      </button>
    </div>
  );
}
