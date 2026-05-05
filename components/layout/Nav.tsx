'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { siteConfig } from '@/config/site.config';
import { useCart } from '@/lib/shopify';
import { cn } from '@/lib/cn';

/**
 * Nav
 *
 * Fixed top-of-page navigation per spec §3 + Prompt deliverable §5.
 *
 * Scroll behavior:
 *   - Transparent over hero (top of page, before user scrolls past
 *     ~85vh — slightly less than 100vh so the transition completes
 *     before the hero is fully out of view).
 *   - Solid `--ink` background once scrolled past hero.
 *   - Implemented via scroll listener (lightweight; Intersection
 *     Observer would also work but adds a sentinel element to the
 *     hero — scroll listener is simpler and fine for this purpose).
 *
 * Mobile (<768px):
 *   - Hamburger button replaces the inline links.
 *   - Tap opens a full-screen overlay sliding in from the right.
 *   - ESC and click-outside close it.
 *   - Body scroll is locked while open.
 *
 * Active route indicator:
 *   - 1px underline below the current page link (spec §5 filter
 *     active state pattern, applied to nav for consistency).
 *
 * Cart count:
 *   - Placeholder 0 for now. Wired to Shopify cart state in Prompt 3.
 *   - The label intentionally renders as `CART(0)` (no space) per spec §3.
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll listener — toggle solid background past ~85vh.
  useEffect(() => {
    const threshold = () => window.innerHeight * 0.85;
    const onScroll = () => setScrolled(window.scrollY > threshold());
    onScroll(); // initial
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // ESC closes mobile menu.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Lock body scroll while mobile menu open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close menu on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Live cart state — wired to Shopify via CartContext (Prompt 3).
  // Returns 0 when cart hasn't booted yet or Shopify is unconfigured,
  // so the badge is never undefined.
  const { cartCount, openCart } = useCart();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
          scrolled || mobileOpen ? 'bg-ink' : 'bg-transparent'
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 md:h-20 md:px-6"
        >
          {/* Logo — always visible. Sized small for nav bar. */}
          <Logo width={108} />

          {/* Desktop links */}
          <ul className="hidden items-center gap-10 md:flex">
            {siteConfig.nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'relative font-sans text-nav uppercase text-paper',
                    'transition-opacity duration-200 hover:opacity-70',
                    isActive(link.href) &&
                      'after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-px after:bg-paper'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openCart}
                aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                className={cn(
                  'font-sans text-nav uppercase text-paper',
                  'transition-opacity duration-200 hover:opacity-70'
                )}
              >
                {`Cart(${cartCount})`}
              </button>
            </li>
          </ul>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-overlay"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
          >
            <span className="sr-only">Menu</span>
            {/* Three-line icon → X when open. Pure CSS, no icon lib. */}
            <span className="relative block h-3 w-6">
              <span
                className={cn(
                  'absolute left-0 right-0 h-px bg-paper transition-all duration-300',
                  mobileOpen ? 'top-1.5 rotate-45' : 'top-0'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 right-0 top-1.5 h-px bg-paper transition-all duration-300',
                  mobileOpen ? 'opacity-0' : 'opacity-100'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 right-0 h-px bg-paper transition-all duration-300',
                  mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div
        id="mobile-nav-overlay"
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed inset-0 z-40 bg-ink transition-transform duration-400 ease-lookbook md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col px-6 pb-12 pt-24">
          <ul className="flex flex-col gap-8">
            {siteConfig.nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'font-display text-display-m text-paper',
                    isActive(link.href) && 'underline underline-offset-[6px]'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openCart();
                }}
                className="font-display text-display-m text-paper"
              >
                {`Cart (${cartCount})`}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
