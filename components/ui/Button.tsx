'use client';

import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Button
 *
 * Three variants per spec §2:
 *
 *   primary   — paper bg, ink text, 14×36 padding, Inter uppercase 500
 *               at 0.06em tracking, 1px radius. Locked CTA style.
 *
 *   ghost     — transparent, 1px paper border. Hover inverts (paper bg,
 *               ink text). Same paddings as primary.
 *
 *   text-link — no chrome. No underline at rest, underline 4px offset
 *               on hover. Optional trailing arrow → suffix. Used for
 *               "Shop Collection →" hero CTA, footer "View Cart", etc.
 *
 * Sizes (sm/md/lg):
 *   sm — 10×24 padding, text-caption (11px)
 *   md — 14×36 padding, text-ui (13px)        — DEFAULT, matches spec
 *   lg — 18×48 padding, text-ui (13px)        — for marquee CTAs
 *
 * The `as` prop polymorphism lets the button render either a <button>
 * (default), an <a> (external link), or a <Link> (internal route).
 *
 * Loading state replaces children with a subtle pulsing dot row and
 * disables interaction. Disabled state lowers opacity and removes
 * pointer events.
 *
 * Hover transitions: 600ms ease-out per Prompt 2 §1.
 */

type Variant = 'primary' | 'ghost' | 'text-link';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  /** Renders a small trailing arrow (→). Always-on for text-link CTAs. */
  arrow?: boolean;
  loading?: boolean;
  /** Visible content. */
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    as?: 'button';
    href?: never;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | 'href'> & {
    as: 'link';
    href: string;
    /** External link — renders as <a target="_blank">. */
    external?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Variant + size styling tables — kept here (not in cn()) so the
// classnames are statically analyzable by the Tailwind JIT.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-paper text-ink border border-paper hover:bg-transparent hover:text-paper',
  ghost:
    'bg-transparent text-paper border border-paper hover:bg-paper hover:text-ink',
  // text-link is handled separately — no padding, no border, just type.
  'text-link': '',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-6 py-2.5 text-caption',
  md: 'px-9 py-3.5 text-ui', // 14px / 36px — locked spec primary CTA
  lg: 'px-12 py-[18px] text-ui',
};

const BASE_BUTTON_CLASSES = cn(
  'inline-flex items-center justify-center gap-2',
  'font-sans font-medium uppercase',
  'tracking-[0.06em]', // spec §2 locked tracking
  'rounded-sm', // 1px radius max
  'transition-all duration-600 ease-out',
  'disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-paper focus-visible:outline-offset-2'
);

const TEXT_LINK_CLASSES = cn(
  'inline-flex items-center gap-2',
  'font-sans uppercase',
  'tracking-[0.06em]',
  'text-ui text-paper',
  'transition-all duration-300 ease-out',
  'underline-offset-[4px] decoration-paper',
  'hover:underline'
);

/** Subtle pulsing dots used in loading state. */
function LoadingDots() {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1">
      <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
      <span
        className="h-1 w-1 animate-pulse rounded-full bg-current"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="h-1 w-1 animate-pulse rounded-full bg-current"
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    arrow = false,
    loading = false,
    children,
    className,
    ...rest
  } = props;

  // Compose classes per variant. text-link gets its own branch.
  const isTextLink = variant === 'text-link';
  const composed = isTextLink
    ? cn(TEXT_LINK_CLASSES, className)
    : cn(
        BASE_BUTTON_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      );

  // Inner content — loading state replaces children, otherwise children
  // (+ optional arrow) are rendered.
  const content = loading ? (
    <LoadingDots />
  ) : (
    <>
      {children}
      {arrow && (
        <span aria-hidden="true" className="inline-block translate-y-px">
          →
        </span>
      )}
    </>
  );

  // Polymorphism: 'link' branch renders Next.js <Link>, else <button>.
  if (rest.as === 'link') {
    const {
      as: _as,
      external,
      href,
      ...anchorRest
    } = rest as ButtonAsLink & {
      as: 'link';
    };
    void _as;
    if (external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={composed}
          {...anchorRest}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={composed}
        {...anchorRest}
      >
        {content}
      </Link>
    );
  }

  const { as: _as, ...buttonRest } = rest as ButtonAsButton;
  void _as;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={composed}
      disabled={loading || (buttonRest as { disabled?: boolean }).disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
});
