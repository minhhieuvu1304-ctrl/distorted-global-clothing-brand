'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { siteConfig } from '@/config/site.config';
import type { HeroVideoSource } from '@/config/site.config';
import {
  useReducedMotion,
  useMediaQuery,
  useScrollPosition,
} from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Hero
 *
 * Spec §4 Section 1 + Prompt 4 §1.
 *
 * Three responsibilities, in order of importance:
 *
 *   1. Source-agnostic video architecture. The component reads
 *      `siteConfig.hero.videoSource` (a discriminated union) and
 *      branches on `type` to render YouTube / Cloudflare / MP4. This
 *      is the locked architecture per spec §4 + Prompt 4 — swapping
 *      providers later is a config-only change.
 *
 *   2. Editorial overlay — Bodoni headline, italic subhead, Inter CTA,
 *      bottom-left positioned. All three fade in sequentially after
 *      page load (0 / 200ms / 400ms staggered).
 *
 *   3. Scroll cue at bottom-center, hidden after the user scrolls
 *      meaningfully into the page.
 *
 * Reduced motion: skips video entirely, renders the poster image as
 * a static <Image>. The full overlay still appears (without staggered
 * fade) so the page is still functional and visually intact.
 *
 * Mobile (<768px):
 *   - If `mobileVideoId` / `mobileStreamUrl` / `mobileSrc` is
 *     provided, that source is used. Otherwise the desktop source
 *     plays on mobile too (acceptable temporary state per spec §15).
 *   - Headline scales to 56px per the type spec.
 */

export function Hero() {
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const scrollY = useScrollPosition();

  // Mounted gate — the staggered fade-in should run AFTER hydration
  // so SSR markup matches first client paint, and the animations
  // begin at "load" rather than mid-hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { videoSource, posterImage, headline, subhead, cta, scrollCueLabel } =
    siteConfig.hero;

  // Hide scroll cue once the user has scrolled past ~25% of the
  // viewport — far enough to read as intentional, not jitter.
  const showScrollCue =
    scrollY < (typeof window !== 'undefined' ? window.innerHeight * 0.25 : 200);

  return (
    <section
      aria-label="Hero"
      className={cn(
        // Full-bleed: the layout's <main> doesn't pad-top because the
        // nav is transparent over the hero (per spec §3). Negative
        // margin not needed.
        'relative h-screen w-screen overflow-hidden bg-shadow'
      )}
    >
      {/* ─────────────────────────────────────────────
          BACKGROUND VIDEO (or poster, when reduced motion)
          ───────────────────────────────────────────── */}
      {reduced ? (
        <PosterFallback src={posterImage} alt={headline} />
      ) : (
        <VideoBackground
          source={videoSource}
          isMobile={isMobile}
          poster={posterImage}
        />
      )}

      {/* ─────────────────────────────────────────────
          GRADIENT OVERLAYS — top for nav legibility,
          bottom for headline/CTA legibility (spec §4)
          ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-shadow/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-shadow/70 via-shadow/30 to-transparent"
      />

      {/* ─────────────────────────────────────────────
          EDITORIAL OVERLAY — bottom-left positioning
          ───────────────────────────────────────────── */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-10',
          'px-6 pb-16 md:px-12 md:pb-20 lg:px-16 lg:pb-24'
        )}
      >
        <div className="mx-auto max-w-[1680px]">
          {/* Headline — fade in immediately on mount */}
          <h1
            className={cn(
              'font-display uppercase text-paper',
              'text-[56px] leading-[1.05] tracking-[-0.01em] md:text-display-xl',
              !reduced && 'opacity-0',
              !reduced && mounted && 'animate-hero-fade-in'
            )}
            style={reduced || !mounted ? undefined : { animationDelay: '0ms' }}
          >
            {headline}
          </h1>

          {/* Subhead — Bodoni italic, mist, 200ms after headline */}
          <p
            className={cn(
              'mt-3 font-display italic text-mist md:mt-4',
              'text-[18px] leading-[1.4] md:text-[20px]',
              !reduced && 'opacity-0',
              !reduced && mounted && 'animate-hero-fade-in'
            )}
            style={
              reduced || !mounted ? undefined : { animationDelay: '200ms' }
            }
          >
            {subhead}
          </p>

          {/* CTA — Inter uppercase, hover underline, 400ms */}
          <div
            className={cn(
              'mt-8 md:mt-10',
              !reduced && 'opacity-0',
              !reduced && mounted && 'animate-hero-fade-in'
            )}
            style={
              reduced || !mounted ? undefined : { animationDelay: '400ms' }
            }
          >
            <a
              href={cta.href}
              className={cn(
                'inline-flex items-center gap-2',
                'font-sans text-nav uppercase text-paper',
                'underline-offset-[4px] transition-all duration-300 ease-out',
                'hover:underline'
              )}
            >
              {cta.label}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          SCROLL CUE — bottom-center, hides on scroll
          ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center',
          'transition-opacity duration-600 ease-out',
          showScrollCue ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-mist">
            {scrollCueLabel}
          </span>
          <span
            className={cn(
              'block h-10 w-px bg-mist',
              !reduced && 'animate-scroll-pulse'
            )}
          />
        </div>
      </div>

      {/*
        The `animate-hero-fade-in` and `animate-scroll-pulse` classes
        are defined in styles/globals.css — the keyframes are scoped
        to the hero but live in the global stylesheet to avoid
        bringing in styled-jsx for one-offs.
      */}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// VIDEO RENDERERS — branched per source type
// ──────────────────────────────────────────────────────────────────────

interface VideoBackgroundProps {
  source: HeroVideoSource;
  isMobile: boolean;
  /** Used by HTML5 <video> as a poster, also the SSR fallback image. */
  poster: string;
}

function VideoBackground({ source, isMobile, poster }: VideoBackgroundProps) {
  switch (source.type) {
    case 'youtube':
      return (
        <YouTubeBackground
          videoId={
            isMobile && source.mobileVideoId
              ? source.mobileVideoId
              : source.videoId
          }
        />
      );
    case 'cloudflare':
      return (
        <CloudflareBackground
          streamUrl={
            isMobile && source.mobileStreamUrl
              ? source.mobileStreamUrl
              : source.streamUrl
          }
        />
      );
    case 'mp4':
      return (
        <Mp4Background
          src={isMobile && source.mobileSrc ? source.mobileSrc : source.src}
          poster={source.poster ?? poster}
        />
      );
  }
}

/**
 * YouTube embed — v1 source per spec §4.
 *
 * The locked URL parameter set (Prompt 4 §1):
 *   autoplay=1, mute=1, loop=1, playlist=VIDEO_ID, controls=0,
 *   modestbranding=1, rel=0, showinfo=0, iv_load_policy=3,
 *   disablekb=1, fs=0, playsinline=1
 *
 * `playlist=VIDEO_ID` is required for `loop=1` to work (YouTube's
 * loop param only operates on a playlist; we point it at the same
 * video so it loops itself).
 *
 * Branding mitigation:
 *   1. URL parameters minimize chrome (modestbranding, controls=0).
 *   2. iframe is sized 110% of viewport in both axes and centered,
 *      pushing the bottom-right "YouTube" watermark off-screen most
 *      of the time.
 *   3. `pointer-events: none` so the user cannot click into the
 *      iframe and reveal YouTube UI.
 *
 * Per spec §16, this is the v1 architecture; switching to Cloudflare
 * Stream is a one-line config change.
 */
function YouTubeBackground({ videoId }: { videoId: string }) {
  // Build the embed URL with all locked parameters.
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    playsinline: '1',
  });
  const src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/*
        16:9 iframe sized to over-cover the viewport.

        We achieve this with:
          - `aspect-video` (16/9)
          - `min-w-[177vh]` so when the viewport is taller than 16:9
             (portrait mobile), the iframe width is height × 16/9
          - `min-h-[56.25vw]` so when wider than 16:9, the iframe
             height is width × 9/16
          - `w-[110vw] h-[110vh]` baseline upsizing to push branding
             edges further off-screen, per Prompt 4 §1
          - centered absolutely so the over-bleed is symmetric

        Combined: the iframe always fully covers the viewport AND
        extends ~5% past every edge.
      */}
      <iframe
        title="Hero video"
        src={src}
        loading="eager"
        allow="autoplay; encrypted-media; picture-in-picture"
        // sandbox is intentionally NOT set — YouTube's embed needs
        // same-origin postMessage to autoplay; sandboxing breaks it.
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'aspect-video',
          'w-[110vw] min-w-[177vh]',
          'h-[110vh] min-h-[61.875vw]', // 110vw * 9/16 = 61.875vw
          'pointer-events-none border-0'
        )}
      />
    </div>
  );
}

/**
 * Cloudflare Stream — built but not used in v1.
 * Stream provides an iframe URL like:
 *   https://customer-<id>.cloudflarestream.com/<video-id>/iframe?
 *     autoplay=true&loop=true&muted=true&controls=false
 * Owner pastes the full URL into config — we don't construct it
 * because Stream's URL format includes a customer-specific subdomain.
 */
function CloudflareBackground({ streamUrl }: { streamUrl: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <iframe
        title="Hero video"
        src={streamUrl}
        loading="eager"
        allow="autoplay; encrypted-media; picture-in-picture"
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'aspect-video',
          'w-[110vw] min-w-[177vh]',
          'h-[110vh] min-h-[61.875vw]',
          'pointer-events-none border-0'
        )}
      />
    </div>
  );
}

/**
 * Self-hosted MP4 — built but not used in v1. Useful when the owner
 * hosts video on Cloudflare R2 / S3 / their own CDN.
 *
 * `playsInline` is critical for iOS — without it, autoplay-muted
 * videos open the system fullscreen player on tap, which would be
 * disastrous for a hero background.
 */
function Mp4Background({ src, poster }: { src: string; poster: string }) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      preload="auto"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

/**
 * Reduced-motion fallback. Uses next/image for proper sizing and
 * priority loading — the hero is by definition above-the-fold so
 * `priority` is appropriate.
 */
function PosterFallback({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
  );
}
