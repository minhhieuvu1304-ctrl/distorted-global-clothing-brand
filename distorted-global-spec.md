# DISTORTED.GLOBAL — Project Specification

> Consolidated specification document compiled from full discussion. This is the source of truth for the build. All design, content, and technical decisions are locked unless explicitly noted as outstanding.

---

## 1. PROJECT OVERVIEW

### Brand Positioning

Luxury cut & sew fashion brand combining high-quality garments with darker streetwear aesthetics. Heavy Asian luxury influence. "Accent piece" philosophy — each item designed as a statement piece for a broader outfit.

**Tagline:** _"An experience far beyond fabrics."_

### Reference Brands (Visual Direction)

- A-COLD-WALL\* — industrial precision, brutalist confidence
- Fear of God — refined editorial pacing, quiet luxury
- COS — clean shop architecture, product-first photography
- Badson — typographic identity
- PERSONSOUL — narrative tension, gritty premium
- DULSE1000 — drop-culture restraint

### North Star

The site should feel like a contemporary art gallery's online shop — clothes as artworks, the website as the (black-walled) gallery, the visitor invited to slow down and look.

---

## 2. DESIGN SYSTEM

### Color Palette (Locked)

```
--ink:      #212529   /* primary dark — cool near-black */
--paper:    #E9ECEF   /* primary light — cool off-white */
--mist:     #CED4DA   /* light grey — secondary surfaces */
--steel:    #6C757D   /* mid grey — secondary text, borders */
--smoke:    #1A1D20   /* deeper than ink, elevated dark surfaces */
--shadow:   #0F1112   /* deepest, hero overlays */

/* Earth accents — used only in lookbook/packaging, never UI */
--khaki:    #A89F7E
--sage:     #6B7566
--olive:    #4A5240
```

**Default mode:** dark (`--ink` background, `--paper` text). Light editorial breaks used sparingly.

### Typography (Locked)

- **Display:** Bodoni 72 Oldstyle (headlines, product names, statements)
- **Supporting/UI/Body:** Inter (navigation, body, buttons, captions)

**Type scale (desktop):**

```
Display XL  Bodoni 72 Oldstyle  96px / 1.05 / -0.01em
Display L   Bodoni 72 Oldstyle  64px / 1.1  / -0.01em
Display M   Bodoni 72 Oldstyle  40px / 1.15 / 0
Heading     Bodoni 72 Oldstyle  24px / 1.3  / 0
Body        Inter               15px / 1.55 / 0
UI / Nav    Inter               13px / 1.4  / 0.04em (uppercase)
Caption     Inter               11px / 1.4  / 0.08em (uppercase)
```

### Logo System (Locked)

- **Primary wordmark:** hand-drawn cursive D + "istorted" + mirrored shadow underneath
  - SVG provided, light + dark variants
  - Used in nav, header, primary brand identification
  - Match logo SVG to section background (white logo on dark sections, dark logo on light sections)
  - At sizes below 32px, simplified version (without reflection)
- **Secondary emblem:** four-pointed mon
  - Used for: favicon, social avatars, packaging, loading states, footer accent

### Spacing & Grid (Locked)

- **Base unit:** 8px
- **Scale:** 4, 8, 16, 24, 32, 48, 64, 96, 128, 160, 192, 256
- **Section padding (vertical):** 160px desktop / 80px mobile
- **Container max-width:** 1680px (hero/lookbook), 1440px (shop)
- **Gutter:** 24px desktop / 16px mobile
- **Grid:** 12-column, used asymmetrically

### Buttons & Interactive (Locked)

- **Primary CTA:** paper background, ink text, 14px 36px padding, Inter uppercase, 0.06em tracking, weight 500, 1px border-radius max
- **Ghost:** transparent, 1px paper border, hover inverts
- **Form inputs:** transparent, 1px bottom border, focus state = paper border
- **Text links:** no underline default, underline on hover with 4px offset

### Motion (Locked)

- **Fade-in on scroll:** 600ms ease-out, 20px upward translate
- **Image hover (general):** 800ms cross-fade
- **Lookbook hover (special):** 1.04 scale + 0 30px 60px rgba(0,0,0,0.4) shadow + z-index lift, 400ms cubic-bezier(0.22, 1, 0.36, 1)
- **Page transitions:** 300ms fade
- **Smooth scroll:** Lenis library
- **Reduced motion:** `prefers-reduced-motion: reduce` disables all motion

### Tone of Voice (Locked)

- Imperative, terse, declarative
- All caps for CTAs and section labels; sentence case for editorial copy
- No exclamation marks, no emoji
- Restrained punctuation, mostly periods or none

### Asian Luxury Influence (Locked — visual/spatial only, no bilingual text)

- Generous negative space (more than Western luxury)
- Asymmetric composition over symmetric grids
- Stillness and pause in photography
- Material/craft focus in product imagery
- Restrained punctuation in copy

---

## 3. SITE ARCHITECTURE

### Pages

1. **Landing (`/`)** — brand experience, conversion funnel
2. **Shop (`/shop`)** — catalog grid + PDP modals + cart
3. **Lookbook (`/lookbook`)** — pure editorial, 50+ products, Instagram feed at end
4. **Contact (`/contact`)** — Get Early Access signup + general inquiries

### Global Navigation

- Wordmark left, links right: `SHOP / LOOKBOOK / CONTACT / CART(0)`
- Inter, uppercase, 13px, 0.08em tracking
- Transparent over hero, solid `--ink` background once scrolled past
- Cart icon shows live count from Shopify cart state

### Global Footer

- Solid `--ink`, 96px+ vertical padding
- Four columns desktop, single column mobile, all Inter 12-13px

```
[Wordmark]                                    [Emblem]

SHOP              COMPANY           SUPPORT          FOLLOW
Collection        About             Contact          Instagram
Lookbook          Story             Shipping         TikTok
                                    Returns
                                    FAQ

──────────────────────────────────────────────────────────
© 2026 DISTORTED                            Privacy   Terms
```

---

## 4. LANDING PAGE

### Structure (sequential scroll, both desktop and mobile)

1. Hero (100vh) — full-screen video, overlay text
2. Brand Statement (~80vh) — editorial moment
3. Early Access (~80vh) — email + SMS capture
4. Footer

### Section 1 — Hero

- Full viewport (100vh)
- **Background video via YouTube embed (v1) — swappable architecture**
  - Source video: `https://youtu.be/naKi9gw-7Q8` (Distorted Phantom Collection V1, 57s)
  - Mobile vertical asset to be provided separately by client
  - Architecture supports config-flip to Cloudflare Stream or MP4 in future
- Subtle dark gradient overlays (top + bottom) for nav/text legibility
- **Headline:** "DISTORTED" — Bodoni 96px desktop / 56px mobile, positioned bottom-left or center-bottom
- **Subhead:** "An experience far beyond fabrics" — Bodoni italic, 18-20px, `--mist`
- **CTA:** "Shop Collection →" — Inter uppercase, 13px, 0.08em tracking, hover underline
- **Scroll cue:** thin vertical line with subtle pulse, or "SCROLL" in tiny Inter, bottom-center
- 600ms fade-in on load
- Reduced-motion fallback: static poster image

### Section 2 — Brand Statement

- ~80vh, full-bleed
- Background: solid `--ink` OR full-bleed editorial image with dark overlay (final choice during build)
- **Copy:** "An experience far beyond fabrics." — Bodoni 56-64px desktop / 36-40px mobile
- Centered or left-aligned with generous margin
- Fade-in animation as section enters viewport
- Copy stored in editable config (owner can adjust without code)

### Section 3 — Early Access

- ~80vh, solid `--ink`
- Narrow content column (~480px max-width)
- **Headline:** "EARLY ACCESS" — Bodoni 56px desktop / 36px mobile
- **Sub-line:** "First look at drops. Members only." — Inter 14px, `--mist`
- **Email field:** transparent, 1px bottom border `--steel`, paper text, fog placeholder
- **Phone field:** appears below email when SMS toggle enabled, country code selector
- **Submit:** small `→` arrow button to right of input
- **Consent:** Inter 11px `--steel`, auto-adjusts based on SMS flag
- **Success state:** form replaced with Bodoni "You're on the list."
- **Backend:** Klaviyo (email + SMS in one platform)

### SMS Toggle (Locked)

```js
const FEATURES = {
  smsCapture: true, // toggle to false to disable SMS entirely
};
```

When `false`: phone field removed from DOM, consent text auto-swaps to email-only.

---

## 5. SHOP PAGE

### Structure

- Header (~30vh) — "SHOP" or "AW26"
- Filter bar — category-only
- Product grid
- Footer

### Filter Bar (Locked)

```
ALL  ·  HOODIES  ·  SHIRTS  ·  HATS  ·  BELTS
```

- Inter uppercase 12px tracked 0.08em
- Active filter: 1px underline `--paper` with 4px offset
- Inactive: `--steel`, hover lifts to `--mist`
- No sort/size/color filters at v1 catalog scale

### Product Grid (Locked)

- **Desktop:** 4 columns, 24px gutters
- **Tablet:** 3 columns
- **Mobile:** 2 columns, 16px gutters
- **Image aspect:** 3:2 landscape (matches existing assets)
- **Row spacing:** 48px vertical

**Product card contents:**

1. Primary image (3:2)
2. Secondary image revealed on hover (800ms cross-fade)
3. Sold Out tag if applicable
4. Product name — Bodoni 18-20px sentence case
5. Price (USD) — Inter 14px `--mist`

**Card behavior:**

- Click → opens PDP modal (Option A — modal/slide-over)
- Hover: primary→secondary cross-fade, no scale
- No add-to-cart on cards
- No quick-view, no badges except sold-out

### Sold-Out Card Treatment

- Image: 50% `--ink` overlay
- "SOLD OUT" tag overlay: Inter uppercase 13px 0.1em tracking, paper border, transparent
- Product name + price remain at full opacity
- Card still clickable (opens PDP showing "Notify when available")

**Sold-out detection (Shopify integration):**

```js
if (product.variants.every((v) => !v.availableForSale)) {
  // All sizes sold out
}
```

Manual override: tag product with `manual-soldout` in Shopify admin.

### PDP Modal (Option A — locked)

- Full-screen modal opens on top of shop page
- URL state: `/shop?product=hoodie-no-03` (shareable, refreshable)
- Background grid blurs slightly
- Close button (×) top-right
- ESC key closes

**Modal layout:**

- **Left column:** vertical scroll gallery, 4-6 images at 3:2, sticky right column on desktop
- **Right column (sticky):**
  - Item number — Inter uppercase 11px `--steel` tracked 0.1em
  - Product name — Bodoni 28px sentence case
  - Price (USD) — Inter 16px `--paper`
  - Size selector: XS / S / M / L / XL — square buttons, 1px border, transparent. Selected = filled paper, ink text. Sold out = grey + strikethrough, click triggers "Notify when available" inline form (Klaviyo back-in-stock)
  - **Add to Cart** — full-width paper button, Inter uppercase 13px tracked, 16px vertical padding. Brief "ADDED ✓" confirmation, then cart drawer slides in
  - Short description — Inter 14px `--mist`
  - Three accordions (collapsed by default):
    - Story (optional per product)
    - Materials & Care
    - Shipping
- **You may also like** — 4 products from same category, mini-grid below

### Cart Drawer (Locked)

- Slides in from right on add-to-cart
- 320px wide desktop, full-width mobile
- Solid `--ink` background, 1px left border `--smoke`
- Items: small thumbnail, Bodoni name, size, qty, Inter price
- Subtotal in Bodoni at bottom
- "CHECKOUT" primary button → Shopify-hosted checkout (theme-matched)
- "View Cart" text link
- Auto-closes after 4s OR click outside
- Page scroll position preserved

### Currency

- USD only
- Format: `$420` (no decimals if whole), `$420.50` (if needed)

---

## 6. LOOKBOOK PAGE

### Architecture (Locked)

- **Long-scroll editorial, modular layout system**
- Each "row" or "spread" is a self-contained module: `<FullBleedSingle />`, `<AsymmetricPair />`, `<Triptych />`, `<TextBreak />`, etc.
- Lookbook = ordered list of these modules in single config file
- Reordering = reorder list. Adding new layouts = add new module. Entire layout reshufflable without code refactor.
- v1 ships with magazine-spread layouts; system extensible

### Page Structure

- Cover (100vh) — full-bleed cinematic image, Bodoni "AW26" or chapter title, scroll cue
- Intro (~80vh) — mood-setter image + 1-2 lines of poetic Bodoni
- **Editorial sequence** (the body — varies by config):
  - Full-bleed singles
  - Asymmetric pairs
  - Three-up rows / triptychs
  - Vertical detail-shot stacks
  - Text break sections (single Bodoni line, dark backdrop)
- 50+ products featured (easily expandable via config)
- Closing (~60vh) — final image, optional credits
- **Instagram feed section** (before footer) — see Section 7
- "Shop the Collection →" link — Inter uppercase 13px tracked, before footer

### Image Ratio Handling (Locked)

- **Default:** 4:3
- **Other ratios accepted** with smart cropping (`object-fit: cover` + configurable `focalPoint: { x, y }`)
- Page layout aesthetics take priority over image ratios

### Hover Interaction (Locked — Readymag-style)

- Scale: 1.04
- Transition: 400ms cubic-bezier(0.22, 1, 0.36, 1)
- Shadow: 0 30px 60px rgba(0,0,0,0.4)
- Z-index lift: hovered image stacks above neighbors
- Cursor: changes to "+" or "view" indicator
- Click: triggers fullscreen lightbox
- **Mobile:** hover doesn't apply, tap goes directly to lightbox

### Click-to-Zoom Lightbox (Locked)

- Fullscreen, near-black backdrop (90%+ opacity)
- Image scales to fit viewport with ~5% padding
- Open animation: 400ms scale-up from clicked position, ease-out
- Close: × cursor / click outside / ESC
- Navigate: ← → keyboard, swipe on mobile
- No metadata in lightbox (no captions, names, shop links — pure image)
- Loads higher-res version (~2400px) on trigger; in-page version ~1400px

### Performance

- Lazy load via Intersection Observer, 1 viewport ahead of scroll
- Progressive: low-res blurred placeholder → full-res swap
- WebP/AVIF with JPEG fallback
- Cloudflare Images CDN
- Two image sizes per asset (~1400px in-page, ~2400px lightbox)
- Initial LCP < 2.5s — only cover image loads immediately

### Mobile

- All imagery stacks single-column, full-width
- Asymmetric pairs become stacked singles with intentional offset margins
- Same content, no mobile-specific cuts
- Lightbox: tap to close, swipe to navigate

---

## 7. INSTAGRAM FEED SECTION

**Placement:** Lookbook closing section, before "Shop the Collection →" link and footer.

**Service:** EmbedSocial (~$29/month)

**Owner prerequisites:**

- Instagram Business or Creator account (free conversion)
- EmbedSocial account
- Authorize EmbedSocial to read feed
- Provide widget embed code or API credentials

### Section Design

```
[Section header: "FROM THE FEED" or "@distorted.global"]
Inter caption: "Latest"

6-image grid (1:1 squares, since Instagram is square-native)
- Same hover pop-out treatment as lookbook
- Click → opens post on Instagram in new tab

[Follow on Instagram →]
```

### Build Approach

- Build placeholder component at v1
- Layout, styling, hover all production-ready
- Single config update injects credentials when owner ready
- Graceful empty state ("Coming soon" or hidden) until configured

---

## 8. CONTACT PAGE

### Structure

- Header (~30vh) — "GET EARLY ACCESS"
- Signup form (~50vh) — reuses homepage Early Access component (no duplicate headline)
- General inquiries (~40vh) — single email link
- Footer

### Section Details

**Header:** Bodoni "GET EARLY ACCESS" 64-72px desktop / 40-48px mobile

**Signup form:** Identical component to homepage Early Access. Goes straight to:

- "First look at drops. Members only."
- Email field
- Phone field (toggleable via SMS flag)
- Consent disclosure
- Submit
- Success state

**General Inquiries:**

```
INQUIRIES

info@distorted.global
```

- Section label "INQUIRIES" — Inter uppercase 11px `--steel` tracked 0.1em
- Email — Bodoni 32-40px desktop / 24-28px mobile, paper color
- Click triggers `mailto:info@distorted.global`
- Hover: 1px underline with 4px offset
- Optional small line below in Inter 13px `--mist`: "For all inquiries — press, wholesale, support."

**Single email** for all inquiries: `info@distorted.global` (provided to dev later by client)

---

## 9. TECH STACK

### Frontend

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS or CSS Modules (developer's choice — must implement design system tokens)
- **Smooth scroll:** Lenis
- **Scroll reveals:** Intersection Observer
- **Hosting:** Vercel (free tier sufficient for launch, Pro $20/month at scale)

### Commerce

- **Backend:** Shopify (already set up by client — Basic plan)
- **Integration:** Shopify Storefront API (GraphQL)
- **Cart state:** client-side via Shopify cart API, persisted in localStorage
- **Checkout:** Shopify-hosted, theme-matched

### Marketing & Capture

- **Email + SMS:** Klaviyo
- **SMS toggle:** feature flag — v1 ships with SMS enabled
- **Back-in-stock:** Klaviyo automation
- **Welcome flow:** Klaviyo automation on Early Access list signup

### Media

- **Hero video (v1):** YouTube embed (`naKi9gw-7Q8`) with maximum hide-controls parameters
  - Architecture is source-agnostic — config flip to Cloudflare Stream or MP4 in future
- **Mobile hero video:** separate vertical asset, owner-provided
- **Lookbook images:** Cloudflare Images (~$5-8/month)
- **Product images:** Shopify CDN (free with Shopify)

### Social

- **Instagram feed:** EmbedSocial widget ($29/month)

### Compliance & Polish

- **Cookie consent:** custom minimal banner (single line, "OK" dismiss, brand-styled)
- **Legal pages:** owner-provided content (Privacy, Terms, Shipping, Returns)
- **Analytics:** none (relying on Shopify built-in commerce data)

### Domain

- `distorted.global` — already registered to client
- DNS: Vercel (frontend) + Shopify subdomain for checkout

### Version Control

- GitHub (developer's account during build)
- Code transferred to client post-launch

### Estimated Monthly Costs

| Service                 | Cost               |
| ----------------------- | ------------------ |
| Shopify Basic           | $29                |
| Klaviyo (250+ contacts) | $0-30              |
| Cloudflare Images       | $5-8               |
| EmbedSocial             | $29                |
| Vercel                  | $0-20              |
| Domain renewal          | ~$5 (annualized)   |
| **Total**               | **~$70-120/month** |

---

## 10. CONFIG-EDITABLE CONTENT

The owner should be able to edit these without developer help:

- Hero headline ("DISTORTED")
- Hero subhead ("An experience far beyond fabrics")
- Brand statement copy ("An experience far beyond fabrics.")
- Early Access copy ("EARLY ACCESS" / sub-line)
- Section headers across all pages
- Hero video source (YouTube ID, swappable to other sources)
- Lookbook layout (ordered list of modules in single config)
- Lookbook images and per-image focal points
- Footer link structure
- SMS feature flag (`true` / `false`)
- Sold-out manual override tag (set in Shopify admin)

Implementation: single TypeScript/JSON config file at `/config/site.config.ts` — clearly commented for non-technical edits.

---

## 11. RESPONSIVE STRATEGY

- Mobile-first build, but designed for desktop and adapted down
- **Breakpoints:** 640 / 768 / 1024 / 1440 / 1680
- **Mobile typography:** display sizes scale to ~60% of desktop
- **Hero:** separate 9:16 mobile video asset
- **Lookbook:** asymmetric pairs collapse to stacked singles with offset margins
- **Shop:** 2-column grid on mobile
- **Filters:** horizontal scrollable on mobile

---

## 12. PERFORMANCE TARGETS

- LCP (Largest Contentful Paint): under 2.5s
- Hero poster image: under 200KB
- Total landing page weight (initial): under 4MB
- Lookbook initial weight: under 4MB (cover + first viewport only); subsequent images lazy-load
- Image formats: WebP/AVIF with JPEG fallback
- Reduced-motion support throughout

---

## 13. ACCESSIBILITY

- `prefers-reduced-motion: reduce` disables video autoplay, scroll animations, hover scales
- Keyboard navigation: tab order, ESC to close modals/lightbox, arrow keys for lightbox navigation
- Focus states on all interactive elements (subtle paper outline)
- Alt text on all product imagery (auto-pulled from Shopify)
- ARIA labels on icon-only buttons (cart, close, etc.)
- Color contrast: paper-on-ink and ink-on-paper meet WCAG AA minimum

---

## 14. STATUS — RESOLVED ITEMS

✅ Shopify store + custom domain + products configured
✅ Domain `distorted.global` registered
✅ Logo SVGs provided (light + dark variants)
✅ Lookbook photography ready
✅ Social account set up
✅ Email address `info@distorted.global` configured (will be provided)
✅ Hero video (YouTube): `https://youtu.be/naKi9gw-7Q8`
✅ Brand statement copy locked
✅ All design system decisions locked
✅ All page-level architecture locked
✅ Tech stack locked
✅ Cookie banner approach locked
✅ SMS in v1 locked
✅ Polish items deferred to post-launch

## 15. STATUS — OUTSTANDING (Owner Action Items)

- ⏳ Klaviyo account creation + API keys
- ⏳ EmbedSocial account creation + widget credentials
- ⏳ Mobile vertical hero video asset
- ⏳ Per-product Story copy (optional, for select products)
- ⏳ Privacy/Terms/Shipping/Returns policy content
- ⏳ Logo SVG cleanup (strip embedded background rectangles — 5min dev task)
- ⏳ Confirm Instagram is Business/Creator account (or convert)

## 16. DEFERRED — Post-Launch

- Custom cursor on lookbook hover
- Splash screen on first page load
- Designed 404 page
- Multi-currency / multi-language
- User accounts
- Wishlist / save for later
- Search functionality
- Reviews / ratings (intentionally avoided — anti-luxury)
- Live chat (intentionally avoided)
- Press kit / journal page (could be added if needed)
- Switch hero video from YouTube to Cloudflare Stream (if branding becomes an issue)

---

_End of specification document._
