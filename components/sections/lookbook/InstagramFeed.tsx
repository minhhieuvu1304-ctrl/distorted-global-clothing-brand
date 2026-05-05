import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/cn';

/**
 * InstagramFeed
 *
 * Spec §7 + Prompt 6 §6.
 *
 * Two modes:
 *
 *   1. PLACEHOLDER (default while siteConfig.lookbook.instagram
 *      .embedCode is empty). Renders the section header + a 6-tile
 *      grid of empty smoke squares with "Coming soon" in --steel.
 *      Layout, styling, and hover treatment are production-ready so
 *      visual QA can be done before the real feed lands.
 *
 *   2. LIVE EmbedSocial widget. Once owner provides the embed code
 *      from EmbedSocial admin and pastes it into siteConfig
 *      .lookbook.instagram.embedCode, the placeholder is replaced
 *      with that markup via dangerouslySetInnerHTML. EmbedSocial
 *      ships its own JS that mounts the feed; we just give it a
 *      DOM container to attach to.
 *
 * Why dangerouslySetInnerHTML is safe here: the embed code comes
 * from a trusted config file (siteConfig), not user input. The
 * owner pastes a known EmbedSocial snippet. It's the same trust
 * level as any third-party script tag in <head>.
 *
 * "Follow on Instagram →" link below — always rendered, even in
 * placeholder mode.
 */
export function InstagramFeed() {
  const { instagram } = siteConfig.lookbook;
  const hasEmbed = instagram.embedCode.trim().length > 0;

  return (
    <section
      aria-label="Instagram feed"
      className="bg-ink py-section-mobile md:py-section-desktop"
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-12 lg:px-16">
        {/* Section header */}
        <div className="mb-12 flex items-baseline justify-between md:mb-16">
          <h2 className="font-display text-[40px] uppercase leading-[1.1] text-paper md:text-[56px]">
            {instagram.heading}
          </h2>
          <span className="font-sans text-caption uppercase text-mist">
            {instagram.subheading}
          </span>
        </div>

        {/* Body — live widget or placeholder */}
        {hasEmbed ? (
          // Live EmbedSocial widget. The embed code typically includes
          // a <div data-ref="..."> + a <script> tag that mounts into
          // it. We render the markup as-is.
          <div dangerouslySetInnerHTML={{ __html: instagram.embedCode }} />
        ) : (
          <PlaceholderGrid />
        )}

        {/* Follow link — always shown */}
        <div className="mt-12 md:mt-16">
          <Link
            href={instagram.followHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2',
              'font-sans text-[13px] uppercase tracking-[0.08em] text-paper',
              'underline-offset-[4px] transition-all duration-300 ease-out',
              'hover:underline'
            )}
          >
            {instagram.followLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * 6-tile 1:1 placeholder grid. Each tile is the smoke surface color
 * with subtle "Coming soon" text in steel — restrained and
 * professional rather than a giant "TODO" banner.
 *
 * Grid: 3 cols mobile, 6 cols desktop (single row at desktop reads
 * as a strip — appropriate for an Instagram-style feed). Switches
 * back to 3 cols on the smallest viewports for tap-target sanity.
 */
function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative flex aspect-square items-center justify-center bg-smoke"
        >
          <span className="font-sans text-caption uppercase text-steel">
            Coming soon
          </span>
        </div>
      ))}
    </div>
  );
}
