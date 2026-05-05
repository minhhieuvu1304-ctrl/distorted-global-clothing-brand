'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useCookieConsent, useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * CookieBanner
 *
 * Spec §9 (Compliance & Polish) + Prompt 9.
 *
 * Custom-built per spec: "custom minimal banner (single line, 'OK'
 * dismiss, brand-styled)". No third-party library — those bring in
 * branded chrome that conflicts with the locked design system.
 *
 * BEHAVIOR:
 *   - First visit: banner slides up from bottom after 1s delay.
 *   - "OK" button OR ✕ dismiss: writes consent to localStorage with
 *     timestamp; banner slides out (300ms) then unmounts.
 *   - Subsequent visits within 365 days: banner doesn't show.
 *   - After 365 days: consent expires, banner re-prompts.
 *
 * COOKIES & STORAGE AUDIT (Prompt 9 §4):
 *   The site uses minimal browser storage. Documented here so any
 *   future change has to update this comment too.
 *
 *   localStorage:
 *     distorted:cartId         Shopify cart ID (Prompt 3) — necessary
 *                              for the shopping experience; not a
 *                              tracker. Set on first cart interaction.
 *     distorted:cookieConsent  This banner's own consent record.
 *
 *   Cookies set by Shopify:
 *     The Storefront API is called server-side and does not set
 *     cookies on our domain. Shopify's own checkout pages (which
 *     load on shop.distorted.global or checkout.shopify.com — NOT
 *     our domain) set their own session cookies, but those are
 *     governed by Shopify's privacy policy, not ours.
 *
 *   Cookies set by Klaviyo:
 *     Klaviyo's onsite tracker (the public-key script) is NOT loaded
 *     by our code. Subscription POSTs go through our /api routes
 *     server-side, so no Klaviyo cookies are set without an explicit
 *     form submission. If the public-key tracker is added later,
 *     gate it on hasConsented from useCookieConsent.
 *
 *   Cookies set by YouTube:
 *     The hero embed loads from youtube.com when the page renders.
 *     YouTube sets third-party cookies for video session state and
 *     usage analytics. These are out of our control — disclosed in
 *     the placeholder /privacy page.
 *
 *   Anything else (analytics, A/B, ads): NOT IN USE per spec §9
 *   ("Analytics: none — relying on Shopify built-in commerce data").
 *
 * Z-INDEX:
 *   z-[80]. Sits above the fixed Nav (z-50) but below modals (z-[100])
 *   and lightbox (z-[110]). Modal opens cover the banner; closing them
 *   reveals it again. Cart drawer (z-[91]) also covers it temporarily.
 */

export function CookieBanner() {
  const reduced = useReducedMotion();
  const { hasConsented, giveConsent } = useCookieConsent();

  // Three local visibility flags driving the slide animation:
  //   shouldRender    is the banner in the DOM at all? (false until
  //                   we've confirmed user hasn't consented + 1s elapsed)
  //   slidIn          has the slide-up transition completed? (drives
  //                   the translate-y class — false = below viewport,
  //                   true = at rest)
  //   dismissing      is the slide-out in progress? (transient flag
  //                   used to play the 300ms slide-down before
  //                   removing from the DOM)
  const [shouldRender, setShouldRender] = useState(false);
  const [slidIn, setSlidIn] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Show after 1s delay if no consent exists. Cancel timer cleanly on
  // unmount or if hasConsented flips to true mid-wait (shouldn't
  // happen but defensive).
  useEffect(() => {
    if (hasConsented !== false) return;
    const timer = window.setTimeout(() => {
      setShouldRender(true);
      // Flip slidIn on next frame so the initial translate-y-full
      // class applies before the transition kicks in. Without this
      // the banner would just appear at rest with no animation.
      requestAnimationFrame(() => setSlidIn(true));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [hasConsented]);

  function dismiss() {
    // Persist consent immediately so a reload mid-animation behaves
    // correctly. Then play the slide-out before unmounting.
    giveConsent();
    if (reduced) {
      setShouldRender(false);
      return;
    }
    setDismissing(true);
    setSlidIn(false);
    window.setTimeout(() => setShouldRender(false), 300);
  }

  // Render gates — order matters here:
  //   - hasConsented === null         boot in progress; render nothing
  //   - hasConsented === true         consented; render nothing
  //   - hasConsented === false &&
  //     !shouldRender                 1s delay still pending; nothing
  //   - otherwise                     render banner
  if (!shouldRender) return null;

  return (
    <div
      // role="region" + aria-label so screen readers announce it as
      // a discrete content area without interrupting the page focus.
      role="region"
      aria-label="Cookie consent"
      aria-hidden={dismissing}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[80]',
        'border-t border-smoke bg-ink',
        'transition-transform duration-300 ease-out',
        // Slide vocabulary: translate-y-full = below viewport,
        // translate-y-0 = at rest. `slidIn` controls which.
        slidIn ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-[960px] flex-col gap-4 px-6 py-6',
          'md:flex-row md:items-center md:justify-between md:gap-8 md:px-8'
        )}
      >
        {/* Copy with inline privacy link */}
        <p className="font-sans text-[13px] leading-[1.5] text-mist">
          This site uses cookies to enable your shopping experience. By using
          this site, you agree to our use of cookies.{' '}
          <Link
            href="/privacy"
            className="text-paper underline underline-offset-[3px] hover:opacity-80"
          >
            Privacy
          </Link>
        </p>

        {/* Action row — OK button + small ✕ dismiss (per Prompt 9 §1
            "Optional: include small × dismiss button"). Both perform
            the same action; the × is for keyboard/quick-dismiss users. */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className={cn(
              // Min 44px tap target per Prompt 9 §5.
              'flex h-11 w-11 items-center justify-center',
              'font-sans text-[16px] leading-none text-steel',
              'transition-colors duration-300 ease-out hover:text-paper'
            )}
          >
            <span aria-hidden="true">×</span>
          </button>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
