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
 * Asset note:
 * The white variant is an SVG file at /public/logos/. The SVG wraps
 * a raster (PNG) inside an alpha mask, so it renders with proper
 * transparency on dark backgrounds (no visible black box) but is not
 * truly vector — at very large display sizes it can look soft. At
 * the nav size (108px) and footer size (140px) this is not visible.
 *
 * The 'dark' variant still points at the legacy JPEG-renamed-to-PNG
 * file. It is not currently used anywhere — both Nav and Footer use
 * the default ('light') variant. If a dark-background-on-light page
 * is ever added, supply a matching SVG and update the path below.
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
      ? '/logos/distorted-wordmark-white.svg'
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
