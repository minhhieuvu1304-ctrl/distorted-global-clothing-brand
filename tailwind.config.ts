import type { Config } from 'tailwindcss';

/**
 * Tailwind configuration — implements the locked design system from
 * /distorted-global-spec.md Section 2.
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
      // Raw brand tokens map 1:1 to spec; semantic tokens layer on top
      // so components express intent (`bg-background`) rather than
      // raw color (`bg-ink`). Both work; semantic is preferred.
      // ──────────────────────────────────────────────────────────────
      colors: {
        // Raw brand palette
        ink: '#212529', //   primary dark — cool near-black
        paper: '#E9ECEF', // primary light — cool off-white
        mist: '#CED4DA', //  light grey — secondary surfaces
        steel: '#6C757D', // mid grey — secondary text, borders
        smoke: '#1A1D20', // deeper than ink, elevated dark surfaces
        shadow: '#0F1112', // deepest, hero overlays

        // Earth accents — lookbook/packaging only, NEVER UI (spec §2)
        khaki: '#A89F7E',
        sage: '#6B7566',
        olive: '#4A5240',

        // Error/alert — used by form input error state (Prompt 2 §2).
        // Not part of locked spec §2 palette; introduced here as a UI
        // utility token. Keep usage limited to error states only.
        alert: '#B84A3E',

        // Semantic tokens — site is dark-by-default per spec §2.
        // Light-mode overrides live in globals.css under .light-section.
        background: '#212529', // ink
        foreground: '#E9ECEF', // paper
        muted: '#6C757D', //     steel — secondary text
        'muted-foreground': '#CED4DA', // mist
        border: '#1A1D20', //    smoke — borders on dark surfaces
        'surface-elevated': '#1A1D20', // smoke
        'surface-deep': '#0F1112', //    shadow
      },

      // ──────────────────────────────────────────────────────────────
      // Font families (spec §2 — LOCKED)
      //   Display: Bodoni 72 Oldstyle (local) → Bodoni Moda (Google fallback)
      //   Body/UI: Inter (Google, variable 100-900)
      // The actual font-face declarations and Google imports live in
      // app/layout.tsx and globals.css. The fallback chains here
      // protect against font-loading failures.
      // ──────────────────────────────────────────────────────────────
      fontFamily: {
        display: [
          'Bodoni 72 Oldstyle',
          'Bodoni Moda',
          'Didot',
          'Bodoni MT',
          'serif',
        ],
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },

      // ──────────────────────────────────────────────────────────────
      // Type scale (spec §2 — LOCKED, desktop sizes)
      // Format: [size, { lineHeight, letterSpacing }]
      // Mobile down-scale (~60%) handled in component code via
      // responsive variants per spec §11.
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
        ui: ['13px', { lineHeight: '1.4', letterSpacing: '0.04em' }], //   uppercase
        caption: ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }], // uppercase

        // Nav-specific tracking variant — spec §3 uses 0.08em for nav
        // links (vs 0.04em for general UI). Kept as its own token.
        nav: ['13px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },

      // ──────────────────────────────────────────────────────────────
      // Spacing scale (spec §2 — base 8px)
      // Tailwind's default 4px-step scale already covers most of this;
      // we expose the spec's explicit tokens by name for clarity in
      // section padding and lookbook spacing decisions.
      // ──────────────────────────────────────────────────────────────
      spacing: {
        // Spec's explicit scale: 4, 8, 16, 24, 32, 48, 64, 96, 128, 160, 192, 256
        // Tailwind covers 0-96 already. Adding the larger ones:
        '128': '128px',
        '160': '160px', // section padding desktop
        '192': '192px',
        '256': '256px',
        // Mobile section padding helper
        'section-mobile': '80px',
        'section-desktop': '160px',
      },

      // ──────────────────────────────────────────────────────────────
      // Border radius — spec §2 buttons use "1px max" i.e. essentially
      // sharp. We override default 'sm' to 1px and avoid using larger.
      // ──────────────────────────────────────────────────────────────
      borderRadius: {
        none: '0',
        sm: '1px',
        DEFAULT: '1px',
      },

      // ──────────────────────────────────────────────────────────────
      // Animation / motion (spec §2 — LOCKED)
      //   Fade-in on scroll: 600ms ease-out, 20px upward translate
      //   Image hover (general): 800ms cross-fade
      //   Lookbook hover: 1.04 scale, 400ms cubic-bezier(0.22,1,0.36,1)
      //   Page transitions: 300ms fade
      // ──────────────────────────────────────────────────────────────
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

      // ──────────────────────────────────────────────────────────────
      // Lookbook hover shadow (spec §2)
      //   0 30px 60px rgba(0,0,0,0.4)
      // ──────────────────────────────────────────────────────────────
      boxShadow: {
        lookbook: '0 30px 60px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
