# distorted.global

Luxury cut & sew fashion brand site. Built per `distorted-global-spec.md`.

---

## Overview

Four-page Next.js site:

- **`/`** — Hero (YouTube background video) + Brand Statement + Early Access form
- **`/shop`** — Filterable catalog grid + PDP modal + cart drawer
- **`/lookbook`** — Modular long-scroll editorial with image lightbox
- **`/contact`** — Early Access signup + direct email inquiries

Plus `/privacy` (placeholder) and standard `/sitemap.xml`, `/robots.txt`.

The whole stack is dark by default — black-walled gallery aesthetic.
Bodoni for display, Inter for everything else. Strict adherence to
the locked design system in spec §2.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS** — design tokens in `tailwind.config.ts` map 1:1 to spec §2
- **Lenis** — smooth scroll inertia, disabled when `prefers-reduced-motion`
- **next/font** — Inter + Bodoni Moda (web fallback for Bodoni 72 Oldstyle)
- **Shopify Storefront API** — catalog + cart + checkout
- **Klaviyo** — email + SMS subscription, back-in-stock automation
- **ESLint** + **Prettier** with `prettier-plugin-tailwindcss`
- **Vercel** — hosting, ISR, edge image optimization

---

## Getting started

```bash
git clone <repo>
cd distorted-global
npm install
cp .env.example .env.local   # fill in real values — see below
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run typecheck            # tsc --noEmit (strict)
npm run lint                 # next lint
npm run format               # prettier --write
npm run build                # production build
npm run start                # serve the production build locally
```

Test the Klaviyo connection (after credentials are set):

```bash
npx tsx scripts/test-klaviyo.ts
```

This subscribes a unique test email to your Early Access list, then
unsubscribes it — verifies your private key, list ID, and scopes
without polluting the list.

---

## Environment variables

See `.env.example` for the full list and dashboard navigation hints.
Required for full functionality:

| Variable                                      | What it enables                      |
| --------------------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`            | Catalog and cart                     |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Catalog and cart                     |
| `KLAVIYO_PRIVATE_KEY`                         | Subscription forms (server-only)     |
| `KLAVIYO_LIST_ID_EARLY_ACCESS`                | Early Access target list             |
| `NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY`              | Reserved for future analytics events |

Optional / deferred:

| Variable                                     | What it enables                                         |
| -------------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_CLOUDFLARE_IMAGES_DELIVERY_URL` | Lookbook image CDN (currently uses picsum placeholders) |

The site runs in graceful "no Shopify / no Klaviyo" mode when these
are missing — catalog renders empty state, cart hides, forms surface
"service temporarily unavailable" — so other features can be developed
before credentials arrive.

---

## Folder structure

```
/app                       Next.js App Router routes
  /api/klaviyo             Server endpoints (subscribe + back-in-stock)
  /shop                    Catalog page (server component)
  /lookbook                Editorial page
  /contact                 Contact page
  /privacy                 Placeholder privacy policy
  layout.tsx               Root layout — fonts, providers, nav, footer, banner
  page.tsx                 Homepage
  sitemap.ts robots.ts     Auto-generated SEO routes
  error.tsx not-found.tsx  Global error boundary + 404
/components
  /ui                      Primitives (Button, Input, Modal, Drawer, Lightbox, etc.)
  /layout                  Nav, Footer, Logo, CartDrawer, CookieBanner
  /sections                Page-specific compositions
    /lookbook              Modular layout system (FullBleedSingle, Triptych, etc.)
/config
  site.config.ts           ⭐ Owner-editable: copy, links, feature flags, footer
  lookbook.config.ts       ⭐ Owner-editable: lookbook section ordering
/lib
  /shopify                 Storefront API client + cart context (Prompt 3)
  /klaviyo                 Server-only API client (Prompt 8)
  /hooks                   useReducedMotion, useScrollPosition, useCookieConsent, etc.
  cn.ts types.ts rateLimit.ts
/public
  /logos                   Distorted wordmark SVGs
  /fonts                   Reserved for licensed Bodoni 72 Oldstyle webfont
  hero-poster.jpg          Reduced-motion + initial-load fallback
  og-image.jpg             Social sharing card (1200×630)
  favicon.ico
/scripts
  test-klaviyo.ts          Connectivity smoke test
/styles
  globals.css              Tailwind layers + base + reduced-motion + keyframes
```

---

## Architecture summary

**Server vs client split.** Pages that just read static config + Shopify
data (`/shop`, `/contact`, `/privacy`) are server components and stream
HTML for fast TTFB. Anything touching browser APIs (cart state, modals,
URL search params) is client-bounded — that's most of `/components/ui`
and the section coordinators (`ShopClient`, `LookbookClient`).

**Data flow.**

- Shopify reads happen server-side with 60s ISR cache (`/lib/shopify`).
  Cart writes happen client-side from `<CartProvider>`, persisting the
  cart ID to localStorage so reloads keep state.
- Klaviyo writes happen entirely server-side via `/app/api/klaviyo/*`
  routes — the private key never crosses the wire to the browser.
  Forms POST to those routes; the routes rate-limit (5/min/IP), validate,
  and call the Klaviyo bulk endpoints with TCPA-compliant consent flags.

**Lookbook layout system.** The lookbook is fully driven by the ordered
array in `/config/lookbook.config.ts`. Each entry is a discriminated-
union "section" (cover / full-bleed-single / asymmetric-pair / triptych
/ detail-stack / text-break) and the page walks the array in order. To
reorder: move entries up/down. To add a new section: insert an object —
TypeScript will prompt for the right fields per `type`.

**Image strategy.**

- Product images: Shopify CDN, served via `next/image` (auto WebP/AVIF).
- Lookbook images: picsum placeholders for v1; owner replaces with
  Cloudflare Images URLs at launch (`NEXT_PUBLIC_CLOUDFLARE_IMAGES_DELIVERY_URL`
  - Cloudflare image variants).
- Hero video: YouTube embed by default; architecture supports swapping
  to Cloudflare Stream or self-hosted MP4 by changing
  `siteConfig.hero.videoSource`.

**Design tokens.** Brand colors (ink, paper, mist, steel, smoke, shadow,
khaki, sage, olive, alert) and the type scale (display-xl/l/m, heading,
body, ui, nav, caption) are Tailwind tokens. Use them directly:

```tsx
<h1 className="font-display text-display-xl text-paper">…</h1>
<a  className="font-sans text-nav uppercase text-mist">…</a>
```

---

## Owner-editable content

**Two config files cover almost everything:**

### `/config/site.config.ts`

| Field                                             | What it controls                                |
| ------------------------------------------------- | ----------------------------------------------- |
| `meta.title` / `meta.description` / `meta.url`    | Site-wide SEO                                   |
| `nav.links[]`                                     | Top nav (cart link is auto)                     |
| `hero.headline` / `subhead` / `cta`               | Homepage hero overlay                           |
| `hero.videoSource`                                | YouTube ID OR Cloudflare Stream URL OR MP4 path |
| `hero.posterImage`                                | Static fallback (reduced-motion + pre-play)     |
| `brandStatement.copy`                             | "An experience far beyond fabrics."             |
| `earlyAccess.headline` / `subline`                | Homepage capture form                           |
| `contact.headline` / `email` / `emailDescription` | Contact page                                    |
| `shop.headline`                                   | "SHOP" or "AW26" or any drop label              |
| `shop.categories[]`                               | Filter row labels + Shopify tag mapping         |
| `lookbook.coverLabel`                             | Cover Bodoni overlay (drop / season name)       |
| `lookbook.credits`                                | Closing credits line (set to `''` to hide)      |
| `lookbook.instagram.embedCode`                    | EmbedSocial widget HTML (empty = placeholder)   |
| `footer.columns[]` / `footer.legalLinks[]`        | Footer grid + bottom row                        |
| `footer.copyrightYear`                            | Update each January                             |
| `features.smsCapture`                             | `true`/`false` to gate the SMS phone field      |
| `shipping.copy`                                   | PDP "Shipping" accordion text                   |

### `/config/lookbook.config.ts`

The ordered list of every section in the lookbook. Reorder, add, or
remove sections by editing this array. Each entry has a `type` and
type-specific fields (TS will guide you).

---

## Common tasks

### Update the hero video

Edit `siteConfig.hero.videoSource` in `/config/site.config.ts`:

```ts
// Different YouTube ID:
videoSource: { type: 'youtube', videoId: 'xxxxxxxxxxx' }

// Cloudflare Stream:
videoSource: { type: 'cloudflare', streamUrl: 'https://customer-…cloudflarestream.com/…/iframe?autoplay=true&loop=true&muted=true&controls=false' }

// Self-hosted MP4:
videoSource: { type: 'mp4', src: '/videos/hero.mp4', poster: '/hero-poster.jpg' }
```

To add a separate vertical mobile asset, add `mobileVideoId` /
`mobileStreamUrl` / `mobileSrc` next to the desktop value.

### Disable SMS capture

Set `siteConfig.features.smsCapture` to `false`. The phone field is
removed from the DOM site-wide and the consent text auto-swaps to
the email-only variant.

### Add a lookbook section

Open `/config/lookbook.config.ts` and insert an object in the array
where you want it to appear:

```ts
{
  type: 'asymmetric-pair',
  leftImage: ph('look-new-left', 'New look — left'),
  rightImage: ph('look-new-right', 'New look — right'),
  weight: 65,
  offset: 80,
  larger: 'left',
},
```

For real photography, replace the `ph()` placeholders with
`LookbookImage` objects pointing at your CDN URLs.

### Replace placeholder lookbook images

When real photography is ready, swap each `src` and `srcHighRes` with
Cloudflare Images URLs. The structure of the config doesn't change —
only the URLs inside each image entry.

### Update copy on any page

Almost all visible copy is in `/config/site.config.ts`. Search for
the visible string there first.

### Bump the copyright year

`siteConfig.footer.copyrightYear`. Manual; intentional reminder to
review the rest of the page when the year ticks over.

### Update the Klaviyo welcome email

Klaviyo dashboard → Flows → create a flow that triggers when a
profile is added to the Early Access list. Code-side wiring is done.

### Set up the back-in-stock email

Klaviyo dashboard → Flows → "Back in Stock" template. The PDP form
already registers profiles on the right Catalog Variant; the flow
content is configured Klaviyo-side.

---

## Deployment (Vercel)

### One-time setup

1. **GitHub:** push the repo to GitHub (or transfer ownership).
2. **Vercel:** import the GitHub repo into a new Vercel project.
3. **Env vars:** in Vercel project settings → Environment Variables,
   add every variable from `.env.example`. Set scope to "Production"
   (and "Preview" if you want preview deploys to work fully).
4. **Domain:** in Vercel → Domains, add `distorted.global` and
   `www.distorted.global` (with redirect to apex). Follow Vercel's
   DNS instructions to point the registrar at Vercel.
5. **HTTPS:** Vercel provisions SSL automatically — verify
   `https://distorted.global` resolves with a valid cert.

### Deploys

```bash
git push origin main      # auto-deploys to production via Vercel
```

Vercel's preview deploys create a unique URL per PR — useful for QA.

### Post-deploy verification runbook

Run through this list after every production deploy. The first
launch deserves the full sweep; subsequent deploys can focus on
whatever changed.

**Functional**

- [ ] Homepage loads, hero video plays, headline + subhead + CTA fade in
- [ ] Brand statement + Early Access sections fade in on scroll
- [ ] `/shop` loads, products render, filter buttons work and update URL
- [ ] Click a product → modal opens, gallery scrolls, info column is sticky
- [ ] Click a gallery image → lightbox opens with scale-up animation
- [ ] Lightbox ←/→ navigates, ESC closes
- [ ] Select size → Add to Cart → drawer slides in → checkout button → Shopify-hosted checkout works
- [ ] `/lookbook` long-scroll renders all sections, hover scales work on desktop
- [ ] Lookbook image click → lightbox cycles through ALL lookbook images via ←/→
- [ ] Instagram feed: placeholder shows OR live widget renders if `embedCode` set
- [ ] `/contact` form submits → success state appears
- [ ] Email link triggers `mailto:`
- [ ] Cookie banner appears on first visit, "OK" dismisses, doesn't return on reload
- [ ] Privacy link in banner navigates to `/privacy`

**Integrations**

- [ ] Subscribe with a test email — verify it appears in Klaviyo Early Access list
- [ ] Toggle SMS off in config, redeploy, verify phone field disappears
- [ ] Mark a product `manual-soldout` in Shopify — verify Sold Out badge appears
- [ ] Sold-out PDP: notify-when-available form submits → Klaviyo back-in-stock subscription created

**Performance & SEO**

- [ ] Lighthouse on `/`: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95
- [ ] Lighthouse on `/shop`: same targets
- [ ] Lighthouse on `/lookbook`: Performance may be slightly lower due to image weight; ≥ 80 acceptable
- [ ] `/sitemap.xml` returns valid XML with all routes
- [ ] `/robots.txt` references the sitemap
- [ ] Right-click → View Source on `/` shows JSON-LD Organization
- [ ] Right-click → View Source on PDP modal page (`/shop?product=…`) shows JSON-LD Product
- [ ] Share `/` to a Slack / iMessage — OG card renders correctly

**Mobile**

- [ ] Test on real iOS Safari + real Android Chrome
- [ ] Hamburger menu opens, tap closes, tap link navigates
- [ ] Cart drawer is full-width
- [ ] Lookbook tap → lightbox; swipe ←/→ navigates
- [ ] Forms submit on mobile

**Cross-browser**

- [ ] Chrome / Edge: full functionality
- [ ] Safari: video autoplay works (mute is required for autoplay)
- [ ] Firefox: layout renders correctly

---

## Outstanding owner action items

These don't block launch but should be addressed before/around launch:

- Privacy / Terms / Shipping / Returns legal copy (replace `/app/privacy/page.tsx` placeholder; add similar Terms/Shipping/Returns pages)
- Cloudflare Images: upload real lookbook photography, set delivery URL env var, update `lookbook.config.ts`
- EmbedSocial: paste widget embed snippet into `siteConfig.lookbook.instagram.embedCode`
- Mobile vertical hero video (9:16) → set `mobileVideoId`/`mobileStreamUrl`/`mobileSrc` on the hero source
- Real OG image: replace `/public/og-image.jpg` placeholder with a Distorted-branded 1200×630
- Klaviyo welcome flow + back-in-stock flow content (Klaviyo dashboard, not code)
- Bodoni 72 Oldstyle webfont licensing — drop woff2 into `/public/fonts/` and uncomment the `src` lines in `globals.css` if you want non-Apple devices to render the real face

---

## Support

For questions, file an issue on the repo or reach out to the original
developer. The full project specification lives at the project root:
**`distorted-global-spec.md`** — treat it as the source of truth.
