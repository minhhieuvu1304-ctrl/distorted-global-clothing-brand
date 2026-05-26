import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Logo
 *
 * Renders the Distorted wordmark.
 *
 * Per spec §2 logo system: white logo on dark sections, dark logo on
 * light sections. The site is dark by default, so the default variant
 * is 'light' (white wordmark).
 *
 * NOTE — current asset state (owner action item):
 * The current PNG assets at /public/logos/ are JPEG files renamed to
 * .png — they do NOT have alpha channels. The white variant has a
 * pure-black background that blends into --ink (#212529) acceptably
 * well, but on close inspection a faint rectangular edge is visible.
 *
 * For final launch, the owner should provide proper transparent
 * PNGs or (better) SVG versions of the wordmark. When those land,
 * just replace the files at /public/logos/ — no code change needed
 * if filenames are kept.
 *
 * Wrapped in <Link href="/"> by default. Set asLink={false} where
 * inappropriate (e.g. if the logo is already inside a link tree).
 */
interface LogoProps {
  /**
   * 'light' = white wordmark, intended for dark backgrounds (default).
   * 'dark'  = dark wordmark, intended for light backgrounds.
   */
  variant?: 'light' | 'dark';
  /** Width in px. The wordmark is ~4:3 aspect, height is auto-computed. */
  width?: number;
  /** Override of computed height if needed. */
  height?: number;
  /** Wrap in <Link href="/">. Default true. */
  asLink?: boolean;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Override alt text. Default: 'Distorted'. */
  alt?: string;
}

// Native aspect ratio of the provided wordmark assets (577×432, ~4:3).
// Used to compute height from width so callers can supply just one.
const WORDMARK_RATIO = 577 / 432;

export function Logo({
  variant = 'light',
  width = 140,
  height,
  asLink = true,
  className,
  alt = 'Distorted',
}: LogoProps) {
  const computedHeight = height ?? Math.round(width / WORDMARK_RATIO);

  const src =
    variant === 'light'
      ? '/logos/distorted-wordmark-white.png'
      : '/logos/distorted-wordmark-black.png';

  const img = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={computedHeight}
      priority
      className="block"
      style={{ width, height: computedHeight }}
    />
  );

  if (!asLink) {
    return <span className={cn('inline-block', className)}>{img}</span>;
  }

  return (
    <Link
      href="/"
      aria-label="Distorted — home"
      className={cn('inline-block', className)}
    >
      {img}
    </Link>
  );
}
