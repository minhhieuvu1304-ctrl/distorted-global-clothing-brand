import type { Config } from 'tailwindcss';

/**
 * Tailwind configuration — implements the locked design system from
 * /distorted-global-spec.md Section 2 (with font-system revision
 * applied: Bebas Neue / Bodoni Moda / Satoshi).
 *
 * Tokens are organized to mirror the spec exactly. Where the spec
 * specifies values that don't have a 1:1 Tailwind primitive (e.g. the
 * type scale's combined size/line-height/tracking), we expose them as
 * named tokens (e.g. `text-display-xl`) so component code reads as
 * self-documenting design intent rather than raw numbers.
 */

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './config/**/*.{ts,tsx}',
  ],
  theme: {
    // ────────────────────────────────────────────────────────────────
    // Breakpoints (spec §11) — mobile-first
    // ────────────────────────────────────────────────────────────────
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
      '2xl': '1680px',
    },
    // ────────────────────────────────────────────────────────────────
    // Container max-widths (spec §2 Spacing & Grid)
    // 1680px hero/lookbook, 1440px shop — applied per page.
    // ────────────────────────────────────────────────────────────────
    container: {
      center: true,
      padding: {
        DEFAULT: '16px', // mobile gutter
        md: '24px', // desktop gutter
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
        '2xl': '1680px',
      },
    },
    extend: {
      // ──────────────────────────────────────────────────────────────
      // Color palette (spec §2 — LOCKED)
      // ──────────────────────────────────────────────────────────────
      colors: {
        ink: '#212529',
        paper: '#E9ECEF',
        mist: '#CED4DA',
        steel: '#6C757D',
        smoke: '#1A1D20',
        shadow: '#0F1112',
        khaki: '#A89F7E',
        sage: '#6B7566',
        olive: '#4A5240',
        alert: '#B84A3E',
        background: '#212529',
        foreground: '#E9ECEF',
        muted: '#6C757D',
        'muted-foreground': '#CED4DA',
        border: '#1A1D20',
        'surface-elevated': '#1A1D20',
        'surface-deep': '#0F1112',
      },

      // ──────────────────────────────────────────────────────────────
      // Font families (Nov 2026 revision — see app/layout.tsx for the
      // full font-system rationale)
      //
      //   font-display → Bebas Neue
      //     Headlines, hero text, drop labels, nav, section labels.
      //     Inherently uppercase by design — no need to add `uppercase`
      //     class alongside `font-display`.
      //
      //   font-serif → Bodoni Moda
      //     Editorial prose. Product descriptions, brand statement,
      //     lookbook text breaks, success states.
      //
      //   font-sans → Satoshi (loaded via Fontshare CDN in layout.tsx)
      //     Functional text. Buttons, form labels, captions, footer,
      //     prices, small UI text.
      //
      // The CSS variables (--font-display, --font-serif) come from
      // next/font/google in app/layout.tsx. Satoshi is referenced by
      // family name directly since it loads via <link> not next/font.
      // ──────────────────────────────────────────────────────────────
      fontFamily: {
        display: [
          'var(--font-display)',
          'Bebas Neue',
          'Impact',
          'Haettenschweiler',
          'sans-serif',
        ],
        serif: [
          'var(--font-serif)',
          'Bodoni Moda',
          'Didot',
          'Bodoni MT',
          'serif',
        ],
        sans: [
          'Satoshi',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },

      // ──────────────────────────────────────────────────────────────
      // Type scale (spec §2 — desktop sizes)
      // ──────────────────────────────────────────────────────────────
      fontSize: {
        'display-xl': [
          '96px',
          { lineHeight: '1.05', letterSpacing: '-0.01em' },
        ],
        'display-l': ['64px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-m': ['40px', { lineHeight: '1.15', letterSpacing: '0' }],
        heading: ['24px', { lineHeight: '1.3', letterSpacing: '0' }],
        body: ['15px', { lineHeight: '1.55', letterSpacing: '0' }],
        ui: ['13px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
        caption: ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        nav: ['13px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },

      // ──────────────────────────────────────────────────────────────
      // Spacing
      // ──────────────────────────────────────────────────────────────
      spacing: {
        '128': '128px',
        '160': '160px',
        '192': '192px',
        '256': '256px',
        'section-mobile': '80px',
        'section-desktop': '160px',
      },

      borderRadius: {
        none: '0',
        sm: '1px',
        DEFAULT: '1px',
      },

      transitionTimingFunction: {
        lookbook: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '300': '300ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 600ms ease-out forwards',
        'fade-in': 'fade-in 600ms ease-out forwards',
      },

      boxShadow: {
        lookbook: '0 30px 60px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
