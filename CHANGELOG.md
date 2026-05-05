# Changelog

All notable changes to distorted.global are documented here. This
project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
conventions and [Semantic Versioning](https://semver.org/).

## [1.0.0] — Launch

Initial production release.

### Stack

- Next.js 14 (App Router) with TypeScript strict
- Tailwind CSS with locked design tokens (spec §2)
- Lenis smooth scroll
- Shopify Storefront API (catalog + cart)
- Klaviyo (email + SMS subscription, back-in-stock notifications)
- Vercel hosting (Edge + ISR)

### Pages

- `/` — Hero (YouTube embed) + Brand Statement + Early Access
- `/shop` — Catalog grid with category filters + PDP modal + cart drawer
- `/lookbook` — Modular long-scroll editorial with lightbox zoom
- `/contact` — Form (reuses Early Access component) + mailto: inquiries
- `/privacy` — Placeholder; replace with counsel-supplied legal content

### Marketing & commerce

- Email + SMS subscription via `/api/klaviyo/subscribe` with TCPA-compliant
  consent + 365-day cookie banner
- Back-in-stock notifications via `/api/klaviyo/back-in-stock`
- Shopify cart with localStorage persistence + Shopify-hosted checkout
- Sold-out detection: variant inventory OR `manual-soldout` tag

### Polish

- Cookie banner with 365-day re-prompt
- JSON-LD structured data (Organization on `/`, Product on PDP modals)
- Native sitemap.xml and robots.txt
- OG / Twitter card metadata on every page
- Custom 404 + global error boundary
- `prefers-reduced-motion` support throughout
- Accessibility: keyboard navigation, ARIA labels, focus rings
- Rate limiting on Klaviyo API routes (5/min/IP)

### Outstanding owner action items (deferred to post-launch)

- Privacy/Terms/Shipping/Returns legal copy
- Cloudflare Images delivery URL + real lookbook photography
- EmbedSocial widget embed code (Instagram feed currently placeholder)
- Mobile vertical hero video asset (9:16)
- Real OG image at `/public/og-image.jpg`
- Bodoni 72 Oldstyle webfont licensing (currently using Bodoni Moda fallback for non-Apple devices)
