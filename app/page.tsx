import { Hero } from '@/components/sections/Hero';
import { BrandStatement } from '@/components/sections/BrandStatement';
import { EarlyAccess } from '@/components/sections/EarlyAccess';
import { siteConfig, type FooterLink } from '@/config/site.config';

/**
 * Homepage — distorted.global landing page.
 *
 * Spec §4 sequence (locked):
 *   1. Hero (100vh)               — full-screen video, overlay text
 *   2. Brand Statement (~80vh)    — editorial moment
 *   3. Early Access (~80vh)       — capture form
 *   4. Footer                     — provided by app/layout.tsx
 *
 * The Footer is rendered globally in the root layout, so this page
 * doesn't include it directly.
 *
 * Lenis smooth scroll (configured in /components/layout/SmoothScrollProvider)
 * handles the slow inertia between sections per the locked motion language.
 *
 * No FadeIn wraps the page itself — Hero owns its own fade-in
 * sequence; Brand Statement and Early Access each wrap their content
 * in <FadeIn /> internally so reveals fire as those sections enter
 * the viewport.
 *
 * JSON-LD Organization is emitted here for SEO — schema.org Organization
 * gives Google a clean signal for the brand identity (sitelinks, knowledge
 * panel). Embedded as a <script type="application/ld+json"> per the
 * standard. Next.js doesn't strip these.
 */
export default function HomePage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.meta.siteName,
    url: siteConfig.meta.url,
    logo: `${siteConfig.meta.url}/logos/Distorted_D_logo_white.svg`,
    description: siteConfig.meta.description,
    sameAs: (
      siteConfig.footer.columns.find((c) => c.heading === 'FOLLOW')?.links as
        | readonly FooterLink[]
        | undefined
    )
      ?.filter((l) => l.external)
      .map((l) => l.href),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify produces safe content because the values are
        // all sourced from siteConfig (developer-controlled) — no user
        // input flows in. This is the standard pattern documented in
        // the Next.js docs for emitting JSON-LD.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Hero />
      <BrandStatement />
      <EarlyAccess />
    </>
  );
}
