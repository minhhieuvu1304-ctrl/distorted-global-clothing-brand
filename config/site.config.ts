/**
 * ═══════════════════════════════════════════════════════════════════════
 * SITE CONFIGURATION — distorted.global
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This is the SINGLE FILE the site owner needs to edit to update
 * copy, links, hero video, feature flags, and footer structure
 * without touching component code.
 *
 * Per spec §10, every value here is owner-editable. Each field is
 * commented with where it appears on the site and what to change it to.
 *
 * Rules of thumb when editing:
 *   • Keep copy in the brand voice — imperative, terse, declarative.
 *     No exclamation marks. No emoji. (See spec §2 "Tone of Voice".)
 *   • Section headers are ALL CAPS; editorial copy is sentence case.
 *   • If you change a field's TYPE (e.g. swap a string for an array),
 *     TypeScript will flag every component that breaks. Don't ignore
 *     those errors — fix the type or the components.
 *
 * After editing this file, save and the dev server will hot-reload.
 * For production: commit, push, Vercel rebuilds automatically.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────

/**
 * Hero video source — architected to swap providers without code
 * changes (spec §4 Section 1, §16 deferred items).
 *
 *   - 'youtube':    YouTube embed (v1 default). `id` is the video ID
 *                   (the part after `youtu.be/` or `?v=`).
 *   - 'cloudflare': Cloudflare Stream. `id` is the Cloudflare video UID.
 *   - 'mp4':        Self-hosted MP4. `src` is the public URL or path.
 *
 * Add new providers here when needed; the Hero component reads
 * `type` and renders the right embed.
 *
 * Field names align with Prompt 4 §1 — `videoId` for YouTube
 * (vs. just `id`), `streamUrl` for Cloudflare, `poster` required
 * for MP4. This is the locked shape downstream Prompt 4 components
 * destructure against.
 */
export type HeroVideoSource =
  | { type: 'youtube'; videoId: string; mobileVideoId?: string }
  | {
      type: 'cloudflare';
      streamUrl: string;
      mobileStreamUrl?: string;
    }
  | { type: 'mp4'; src: string; mobileSrc?: string; poster: string };

/** A single link in the footer — label + href, optional external flag. */
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

/** A column of links in the footer (spec §3). */
export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

/** A top-level nav link (spec §3). */
export interface NavLink {
  label: string;
  href: string;
}

// ──────────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────────

export const siteConfig = {
  // ────────────────────────────────────────────────────────────────────
  // SEO / METADATA
  // Used by app/layout.tsx for <title>, <meta description>, OpenGraph.
  // ────────────────────────────────────────────────────────────────────
  meta: {
    /** Browser tab title and OG title default. */
    title: 'Distorted — An experience far beyond fabrics',
    /** Used in <meta description> and OG description. Keep under 160 chars. */
    description:
      'Distorted. Luxury cut & sew with darker streetwear sensibility — accent pieces designed as statements.',
    /** The bare site name, used as the OG site_name and as a title fallback. */
    siteName: 'Distorted',
    /** Canonical site URL — change to production domain at launch. */
    url: 'https://distorted.global',
  },

  // ────────────────────────────────────────────────────────────────────
  // GLOBAL NAVIGATION (spec §3)
  // Order here determines order in the nav bar (left-to-right).
  // The CART(0) link is rendered separately by the Nav component so
  // the live count can wire into Shopify cart state — do NOT add it
  // to this array.
  // ────────────────────────────────────────────────────────────────────
  nav: {
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'Lookbook', href: '/lookbook' },
      { label: 'Contact', href: '/contact' },
    ] satisfies NavLink[],
  },

  // ────────────────────────────────────────────────────────────────────
  // LANDING — HERO (spec §4 Section 1)
  // ────────────────────────────────────────────────────────────────────
  hero: {
    /** Headline — Bodoni 96px desktop / 56px mobile. The brand name. */
    headline: 'DISTORTED',
    /** Subhead — Bodoni italic. The locked tagline. */
    subhead: 'An experience far beyond fabrics',
    /** Primary CTA — sends visitor to /shop. */
    cta: {
      label: 'Shop Collection',
      href: '/shop',
    },
    /**
     * Hero video source — source-agnostic discriminated union per
     * Prompt 4 §1. v1 ships with the YouTube embed; the Hero
     * component branches on `type` so swapping providers is a
     * config-only change.
     *
     * To swap to Cloudflare Stream later:
     *   { type: 'cloudflare', streamUrl: 'https://customer-...iframe.videodelivery.net/...' }
     * To swap to MP4:
     *   { type: 'mp4', src: '/videos/hero.mp4', poster: '/hero-poster.jpg' }
     *
     * `mobileVideoId` / `mobileStreamUrl` / `mobileSrc` is for the
     * separate 9:16 vertical asset the owner will provide (spec §15
     * outstanding items). Until then, leave undefined and the desktop
     * source is used on mobile too.
     */
    videoSource: {
      type: 'youtube',
      videoId: 'naKi9gw-7Q8', // Distorted Phantom Collection V1, 57s
      // mobileVideoId: '...', // TODO when owner provides vertical asset
    } as HeroVideoSource,
    /**
     * Poster image shown when reduced-motion is active, before the
     * video plays, or as a static fallback when the embed fails.
     * File path is the public root: `/hero-poster.jpg` resolves to
     * /public/hero-poster.jpg per Prompt 4 §1.
     * Recommended: 1920×1080 JPEG/WebP under 200KB (spec §12).
     */
    posterImage: '/hero-poster.jpg',
    /** Scroll cue label, bottom-center of hero. */
    scrollCueLabel: 'SCROLL',
  },

  // ────────────────────────────────────────────────────────────────────
  // LANDING — BRAND STATEMENT (spec §4 Section 2)
  // The big editorial moment between hero and capture form.
  // ────────────────────────────────────────────────────────────────────
  brandStatement: {
    /** Bodoni, 56-64px desktop. Sentence-case with terminal period. */
    copy: 'An experience far beyond fabrics.',
  },

  // ────────────────────────────────────────────────────────────────────
  // EARLY ACCESS CAPTURE (spec §4 Section 3, §8)
  // Reused on /contact. Klaviyo is the backend (wired in Prompt 3).
  // ────────────────────────────────────────────────────────────────────
  earlyAccess: {
    /** Bodoni 56px desktop / 36px mobile, ALL CAPS per tone. */
    headline: 'EARLY ACCESS',
    /** Inter 14px, mist color. */
    subline: 'First look at drops. Members only.',
    /** Email input placeholder. */
    emailPlaceholder: 'Email',
    /** Phone input placeholder (only shown when smsCapture flag is on). */
    phonePlaceholder: 'Phone',
    /**
     * Consent disclosure under the form. Two variants — the Early
     * Access component picks the right one based on the smsCapture flag.
     * Inter 11px, steel color.
     */
    consent: {
      /** Used when smsCapture: true. */
      withSms:
        'By submitting, you agree to receive marketing emails and SMS from Distorted. Message and data rates may apply. Unsubscribe anytime.',
      /** Used when smsCapture: false. */
      emailOnly:
        'By submitting, you agree to receive marketing emails from Distorted. Unsubscribe anytime.',
    },
    /** Replaces the form on successful submit. Bodoni. */
    successMessage: "You're on the list.",
  },

  // ────────────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────
  // CONTACT PAGE (spec §8 + Prompt 7)
  // ────────────────────────────────────────────────────────────────────
  contact: {
    /** Page header — Bodoni 64-72px desktop / 40-48px mobile. */
    headline: 'GET EARLY ACCESS',
    /**
     * Subhead under the form (passed as `sublabel` to <EarlyAccessForm>).
     * The page header already says "EARLY ACCESS" so we don't duplicate
     * a headline here — only the sub-line.
     */
    formSublabel: 'First look at drops. Members only.',
    /** Section label above the email — Inter caption. */
    inquiriesLabel: 'INQUIRIES',
    /**
     * The contact email. Bodoni 32-40px on /contact, triggers `mailto:`.
     * Owner can update at any time.
     */
    email: 'info@distorted.global',
    /**
     * Optional one-liner under the email — Inter 13px in --mist.
     * Set to '' to hide the line entirely.
     */
    emailDescription: 'For all inquiries — press, wholesale, support.',
  },

  // ────────────────────────────────────────────────────────────────────
  // SHOP PAGE (spec §5) — minimal config; categories drive the filter bar.
  // Product data itself comes from Shopify (Prompt 3).
  // ────────────────────────────────────────────────────────────────────
  shop: {
    /**
     * Page header — Bodoni 64-72px desktop. Owner can change to "AW26"
     * or another drop name when launching a new collection.
     */
    headline: 'SHOP',
    /**
     * Filter bar categories (spec §5 LOCKED order: ALL · HOODIES ·
     * SHIRTS · HATS · BELTS).
     *
     * `slug` is the URL value (`/shop?category=hoodies`) and is what
     * appears to users when they share a link. `category` is the
     * singular ProductCategory used by Shopify queries — `null` for
     * the "All" pseudo-category, which fetches every product.
     *
     * Order in this array is render order in the filter bar.
     */
    categories: [
      { label: 'All', slug: 'all', category: null },
      { label: 'Hoodies', slug: 'hoodies', category: 'hoodie' },
      { label: 'Shirts', slug: 'shirts', category: 'shirt' },
      { label: 'Hats', slug: 'hats', category: 'hat' },
      { label: 'Belts', slug: 'belts', category: 'belt' },
    ] as const,
  },

  // ────────────────────────────────────────────────────────────────────
  // SHIPPING — generic copy used in PDP accordion (spec §5)
  // ────────────────────────────────────────────────────────────────────
  shipping: {
    /**
     * Generic shipping copy shown in the PDP "Shipping" accordion.
     * Same text across all products. Owner can edit; should stay
     * brief and informational (Inter 14px reads best at 2-4 sentences).
     *
     * Owner action item (spec §15): replace placeholder with real
     * shipping policy once finalized.
     */
    copy: 'Orders ship within 2-3 business days. Free standard shipping on orders over $200. International shipping available — duties calculated at checkout.',
  },

  // ────────────────────────────────────────────────────────────────────
  // LOOKBOOK PAGE (spec §6) — minimal here; full module list lives in
  // its own config file (config/lookbook.config.ts) once Prompt 2 builds
  // the page. The header label is configurable here.
  // ────────────────────────────────────────────────────────────────────
  lookbook: {
    /** Cover label — Bodoni. Drop name or season. */
    coverLabel: 'AW26',
    /** Closing CTA before footer — Inter uppercase. */
    closingCta: {
      label: 'Shop the Collection',
      href: '/shop',
    },
    /**
     * Optional credits line in the closing section (spec §6, Prompt 6 §5).
     * Inter 11px tracked. Examples: "Photography Foo Bar · Styling Baz Qux".
     * Set to '' to hide the credits row entirely.
     */
    credits: '',
    /** Instagram section header (spec §7). */
    instagram: {
      heading: 'FROM THE FEED',
      subheading: 'Latest',
      followLabel: 'Follow on Instagram',
      followHref: 'https://instagram.com/distorted.global',
      /**
       * EmbedSocial widget embed code. Empty string keeps the
       * placeholder grid; once owner provides the embed snippet
       * from EmbedSocial admin, paste it here and the InstagramFeed
       * component swaps to the live widget.
       *
       * Owner action item (spec §15): create EmbedSocial account,
       * authorize Instagram Business/Creator account, copy the
       * widget embed code into this string.
       *
       * Format example:
       *   '<div class="embedsocial-instagram" data-ref="abc123">…'
       */
      embedCode: '',
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // FOOTER (spec §3)
  // Four columns desktop, single column mobile. To rearrange: reorder
  // the array. To remove a column: delete its object. To add: append.
  // ────────────────────────────────────────────────────────────────────
  footer: {
    /** © year — auto-updates? No, manual. Bump each January. */
    copyrightYear: 2026,
    /** Brand name in copyright line. */
    copyrightHolder: 'DISTORTED',
    columns: [
      {
        heading: 'SHOP',
        links: [
          { label: 'Collection', href: '/shop' },
          { label: 'Lookbook', href: '/lookbook' },
        ],
      },
      {
        heading: 'COMPANY',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Story', href: '/story' },
        ],
      },
      {
        heading: 'SUPPORT',
        links: [
          { label: 'Contact', href: '/contact' },
          { label: 'Shipping', href: '/shipping' },
          { label: 'Returns', href: '/returns' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
      {
        heading: 'FOLLOW',
        links: [
          {
            label: 'Instagram',
            href: 'https://instagram.com/distorted.global',
            external: true,
          },
          {
            label: 'TikTok',
            href: 'https://tiktok.com/@distorted.global',
            external: true,
          },
        ],
      },
    ] satisfies FooterColumn[],
    /** Bottom-row legal links, right-aligned. */
    legalLinks: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ] satisfies FooterLink[],
  },

  // ────────────────────────────────────────────────────────────────────
  // FEATURE FLAGS (spec §4 SMS Toggle, §10)
  //
  // Flip these to enable/disable site-wide capabilities.
  // ────────────────────────────────────────────────────────────────────
  features: {
    /**
     * SMS capture in the Early Access form.
     *   true:  phone field renders, consent text uses 'withSms' variant.
     *   false: phone field removed from DOM, consent uses 'emailOnly'.
     * v1 ships with this enabled per spec §4.
     */
    smsCapture: true,
  },
} as const;

/** Convenience type alias for the full config — useful in components. */
export type SiteConfig = typeof siteConfig;
