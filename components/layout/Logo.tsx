import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Logo
 *
 * Renders the Distorted wordmark. Per spec §2 logo system:
 *   - The logo SVG must MATCH its section's background (white logo on
 *     dark sections; dark logo on light sections).
 *   - The site is dark by default (spec §2), so the default variant
 *     here is 'light' (i.e. the white-on-dark logo file).
 *   - The two SVG files include embedded background rectangles that
 *     are intentionally kept; they ensure the logo always has the
 *     correct backdrop even if a section's background isn't perfectly
 *     opaque. (Owner action item §15: strip these later for a clean
 *     transparent SVG once the design is final.)
 *
 * Wrapped in a Link to / so clicking the logo always returns home —
 * standard convention; if a particular usage shouldn't be linked,
 * pass `asLink={false}`.
 */
interface LogoProps {
  /**
   * 'light' = white logo SVG, intended for dark backgrounds (default).
   * 'dark'  = dark logo SVG, intended for light backgrounds.
   */
  variant?: 'light' | 'dark';
  /** Width in px. Below 32px the logo should use a simplified mark per
   *  spec §2 — for now we just render the same SVG; refine post-launch. */
  width?: number;
  /** Optional override of computed height (otherwise preserves aspect). */
  height?: number;
  /** Wrap in <Link href="/">. Defaults to true. */
  asLink?: boolean;
  /** Extra classes for the wrapping element. */
  className?: string;
  /** Override the alt text. Default: 'Distorted'. */
  alt?: string;
}

export function Logo({
  variant = 'light',
  width = 140,
  height,
  asLink = true,
  className,
  alt = 'Distorted',
}: LogoProps) {
  // SVG aspect ratio is 480:160 = 3:1
  const computedHeight = height ?? Math.round(width / 3);

  const src =
    variant === 'light'
      ? '/logos/Distorted_D_logo_white.svg'
      : '/logos/Distorted_D_logo_black.svg';

  const img = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={computedHeight}
      priority
      className="block"
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
