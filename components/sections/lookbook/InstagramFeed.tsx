import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/cn';

/**
 * InstagramFeed
 *
 * Lookbook closing section (spec §7) — "FROM THE FEED" strip with
 * a 6-image grid linking out to specific Instagram posts.
 *
 * Three render modes, in priority order:
 *
 *   1. LIVE WIDGET — `siteConfig.lookbook.instagram.embedCode` is set.
 *      Renders the EmbedSocial (or other third-party) embed markup.
 *      Forward-compat path — most setups won't use this.
 *
 *   2. CURATED GRID — `siteConfig.lookbook.instagram.posts` has entries.
 *      The default + recommended mode. Owner picks 6 hero images from
 *      their Instagram, each linking to a specific post URL. New tab.
 *      Click-through includes the same ImageHover treatment as the
 *      rest of the lookbook (subtle scale + lift) for design consistency.
 *
 *   3. PLACEHOLDER — both above are empty. Renders 6 "COMING SOON"
 *      smoke tiles. Used during initial dev / before launch content lands.
 *
 * "Follow on Instagram →" link always renders below the grid regardless
 * of mode.
 */
export function InstagramFeed() {
  const { instagram } = siteConfig.lookbook;
  const hasEmbed = instagram.embedCode.trim().length > 0;
  const hasPosts = instagram.posts.length > 0;

  return (
    <section
      aria-label="Instagram feed"
      className="bg-ink py-section-mobile md:py-section-desktop"
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-12 lg:px-16">
        {/* Section header */}
        <div className="mb-12 flex items-baseline justify-between md:mb-16">
          <h2 className="font-display text-[40px] leading-[1.1] text-paper md:text-[56px]">
            {instagram.heading}
          </h2>
          <span className="font-sans text-caption uppercase text-mist">
            {instagram.subheading}
          </span>
        </div>

        {/* Body — three modes resolved here */}
        {hasEmbed ? (
          <LiveEmbed embedCode={instagram.embedCode} />
        ) : hasPosts ? (
          <CuratedGrid posts={instagram.posts} />
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

// ──────────────────────────────────────────────────────────────────────
// Curated grid — 6 hero images linking to specific Instagram posts
// ──────────────────────────────────────────────────────────────────────

interface InstagramPost {
  image: { src: string; alt: string };
  href: string;
}

function CuratedGrid({ posts }: { posts: ReadonlyArray<InstagramPost> }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
      {posts.map((post, i) => (
        <CuratedTile key={`${post.href}-${i}`} post={post} />
      ))}
    </div>
  );
}

function CuratedTile({ post }: { post: InstagramPost }) {
  // Tile uses a plain <a> rather than the lookbook's <ImageHover>
  // primitive because:
  //   - Instagram tiles NAVIGATE OUT (anchor semantics matter for
  //     SEO and accessibility — crawlers can see these as outbound
  //     links to instagram.com).
  //   - Lookbook tiles OPEN A LIGHTBOX (button semantics — no
  //     navigation, no URL).
  //   - Wrapping ImageHover (which renders a <button>) inside an
  //     <a> would produce invalid nested-interactive HTML.
  //
  // The hover treatment is built inline using the same locked
  // design vocabulary as ImageHover (1.04 scale, lookbook shadow,
  // z-index lift, 400ms lookbook easing). The `group` utility makes
  // child elements respond to the parent <a>'s hover state.
  return (
    <a
      href={post.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open Instagram post: ${post.image.alt}`}
      className={cn(
        'group relative block aspect-square overflow-hidden bg-smoke',
        // Hover lift — same vocabulary as <ImageHover />:
        // 1.04 scale via inner div + the locked lookbook shadow.
        // The transform sits on the inner <span> wrapping the image
        // so layout stays intact (the parent <a> doesn't move,
        // only the image content scales).
        'transition-shadow duration-400 ease-lookbook',
        'hover:z-10 hover:shadow-lookbook',
        // Focus ring for keyboard accessibility (matches globals.css)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
      )}
    >
      <span className="block h-full w-full transition-transform duration-400 ease-lookbook group-hover:scale-[1.04] motion-reduce:group-hover:scale-100">
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />
      </span>
    </a>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Placeholder — 6 "COMING SOON" tiles (no embed code, no posts)
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────
// Live embed — EmbedSocial or other third-party widget
// ──────────────────────────────────────────────────────────────────────

function LiveEmbed({ embedCode }: { embedCode: string }) {
  // dangerouslySetInnerHTML is safe here because the embed code
  // comes from a trusted config file (siteConfig), not user input.
  // Same trust level as any <script> tag in <head>.
  return <div dangerouslySetInnerHTML={{ __html: embedCode }} />;
}
