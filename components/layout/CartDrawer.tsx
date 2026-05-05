'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useCart, formatPrice } from '@/lib/shopify';
import { cn } from '@/lib/cn';
import type { CartLineItem } from '@/lib/shopify';

/**
 * CartDrawer
 *
 * Spec §5 cart drawer (LOCKED) + Prompt 3 §6.
 *
 * Wraps the generic <Drawer> with cart-specific content:
 *   - Line items: thumbnail, Bodoni name, variant size, qty selector,
 *     Inter price, remove (×) button.
 *   - Subtotal in Bodoni at bottom.
 *   - CHECKOUT primary button → cart.checkoutUrl (Shopify-hosted).
 *   - "View Cart" text link — currently a placeholder; there's no
 *     dedicated cart page in the locked spec, so it's a no-op. If a
 *     dedicated /cart page lands later, route it there.
 *   - Empty state: Bodoni "Your cart is empty." + link to /shop.
 *
 * Auto-close behavior:
 *   When the drawer was opened by an add-to-cart action (tracked in
 *   CartContext as `openedByAddToCart`), it auto-closes after 4s per
 *   spec §5. When opened manually via the nav cart icon, it stays
 *   open until the user dismisses it — yanking it shut after 4s
 *   while the user is reviewing items would be hostile UX.
 *
 *   The auto-close timing is also exposed via the `autoCloseMs` prop
 *   (default 4000) per Prompt 3 §6.
 */

interface CartDrawerProps {
  /** Auto-close delay when triggered by add-to-cart. Default 4000. */
  autoCloseMs?: number;
}

export function CartDrawer({ autoCloseMs = 4000 }: CartDrawerProps) {
  const {
    cart,
    isCartOpen,
    openedByAddToCart,
    closeCart,
    updateLineItem,
    removeLineItem,
    unconfigured,
  } = useCart();

  // Pass autoCloseMs to the underlying Drawer ONLY when the open was
  // add-to-cart-triggered. Manual opens get `undefined` → no timer.
  const drawerAutoClose = openedByAddToCart ? autoCloseMs : undefined;

  return (
    <Drawer
      open={isCartOpen}
      onClose={closeCart}
      autoCloseMs={drawerAutoClose}
      ariaLabel="Shopping cart"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-sans text-caption uppercase text-mist">Cart</h2>
        </div>

        {/* Body — empty / unconfigured / lines */}
        <div className="flex-1 overflow-y-auto">
          {unconfigured ? (
            <UnconfiguredState />
          ) : !cart || cart.lines.length === 0 ? (
            <EmptyState onClose={closeCart} />
          ) : (
            <ul className="space-y-6">
              {cart.lines.map((line) => (
                <CartLineRow
                  key={line.id}
                  line={line}
                  onUpdateQty={(q) => updateLineItem(line.id, q)}
                  onRemove={() => removeLineItem(line.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only when there's content to check out */}
        {cart && cart.lines.length > 0 && (
          <div className="mt-8 border-t border-smoke pt-6">
            <div className="mb-6 flex items-baseline justify-between">
              <span className="font-sans text-caption uppercase text-mist">
                Subtotal
              </span>
              <span className="font-display text-heading text-paper">
                {formatPrice(cart.subtotalCents)}
              </span>
            </div>
            <Button
              as="link"
              href={cart.checkoutUrl}
              external
              variant="primary"
              size="md"
              className="w-full"
            >
              Checkout
            </Button>
            <button
              type="button"
              onClick={closeCart}
              className={cn(
                'mt-4 block w-full text-center',
                'font-sans text-caption uppercase tracking-[0.06em] text-mist',
                'transition-colors duration-300 ease-out hover:text-paper',
                'underline-offset-[4px] hover:underline'
              )}
            >
              View Cart
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────

interface CartLineRowProps {
  line: CartLineItem;
  onUpdateQty: (quantity: number) => Promise<void>;
  onRemove: () => Promise<void>;
}

function CartLineRow({ line, onUpdateQty, onRemove }: CartLineRowProps) {
  return (
    <li className="flex gap-4">
      {/* Thumbnail — 3:2 product card aspect, small */}
      <Link
        href={`/shop?product=${line.productHandle}`}
        className="block shrink-0"
      >
        <div className="relative h-20 w-[120px] overflow-hidden bg-smoke">
          {line.image && (
            <Image
              src={line.image.src}
              alt={line.image.alt}
              fill
              sizes="120px"
              className="object-cover"
            />
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/shop?product=${line.productHandle}`}
            className="font-display text-[15px] leading-tight text-paper hover:opacity-80"
          >
            {line.productTitle}
          </Link>
          <p className="mt-1 font-sans text-caption uppercase text-steel">
            {line.variantTitle}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onUpdateQty(line.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-6 w-6 items-center justify-center text-paper transition-opacity duration-300 hover:opacity-70"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span
              className="font-sans text-[13px] text-paper"
              aria-live="polite"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(line.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-6 w-6 items-center justify-center text-paper transition-opacity duration-300 hover:opacity-70"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <span className="font-sans text-[14px] text-paper">
            {formatPrice(line.lineTotalCents)}
          </span>
        </div>
      </div>

      {/* Remove × — top-right of the row */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${line.productTitle}`}
        className="self-start text-steel transition-colors duration-300 hover:text-paper"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ×
        </span>
      </button>
    </li>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6 pt-8">
      <p className="font-display text-display-m text-paper">
        Your cart is empty.
      </p>
      <Button
        as="link"
        href="/shop"
        variant="text-link"
        arrow
        onClick={onClose}
      >
        Shop Collection
      </Button>
    </div>
  );
}

function UnconfiguredState() {
  return (
    <div className="flex flex-col items-start gap-4 pt-8">
      <p className="font-display text-heading text-paper">Cart unavailable.</p>
      <p className="font-sans text-[14px] text-mist">
        The catalog is offline. Please try again shortly.
      </p>
    </div>
  );
}
