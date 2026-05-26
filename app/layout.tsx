import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Bodoni_Moda } from 'next/font/google';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { SmoothScrollProvider } from '@/components/layout/SmoothScrollProvider';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { CartProvider } from '@/lib/shopify';
import { siteConfig } from '@/config/site.config';
import '@/styles/globals.css';

/**
 * Root layout
 *
 * Per spec §2: dark by default (ink bg, paper text).
 *
 * FONT SYSTEM (Nov 2026 revision):
 *
 *   --font-display  Bebas Neue        Headlines, hero text, drop labels,
 *                                     nav links, section labels. Inherently
 *                                     uppercase by design, so `uppercase`
 *                                     class is redundant when paired with
 *                                     `font-display`.
 *
 *   --font-serif    Bodoni Moda       Editorial prose. Product descriptions,
 *                                     brand statement, lookbook text breaks,
 *                                     success states, privacy page headings.
 *
 *   --font-sans     Satoshi           Functional text. Buttons, form labels,
 *                                     captions, footer columns, prices,
 *                                     small UI text. Loaded via a CSS
 *                                     <link> below since Satoshi isn't on
 *                                     Google Fonts (Fontshare hosts it).
 *
 * Bebas Neue and Bodoni Moda use next/font/google for self-hosting,
 * font-display: swap, and zero-layout-shift loading. Satoshi loads
 * from Fontshare's CDN — slightly less optimal than next/font but
 * avoids needing to bundle the woff2 files.
 */

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  // Bebas Neue is only available in regular weight (400).
  weight: ['400'],
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.meta.url),
  title: {
    default: siteConfig.meta.title,
    template: `%s — ${siteConfig.meta.siteName}`,
  },
  description: siteConfig.meta.description,
  applicationName: siteConfig.meta.siteName,
  openGraph: {
    type: 'website',
    siteName: siteConfig.meta.siteName,
    title: siteConfig.meta.title,
    description: siteConfig.meta.description,
    url: siteConfig.meta.url,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.meta.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.meta.title,
    description: siteConfig.meta.description,
    images: ['/og-image.jpg'],
  },
  // Favicon — placeholder. Owner action item (spec §15): replace with
  // the four-pointed mon emblem when finalized.
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#212529', // matches --ink so mobile browser chrome blends
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Attach next/font CSS variables (Bebas Neue → --font-display,
      // Bodoni Moda → --font-serif). Satoshi is wired via <link> in
      // <head> below, exposing the family name 'Satoshi' that the
      // Tailwind font-sans stack picks up.
      className={`${bebasNeue.variable} ${bodoniModa.variable}`}
    >
      <head>
        {/*
          Satoshi from Fontshare. Free, commercial-OK, but not on
          Google Fonts so we can't use next/font/google for it.
          Loading via <link> still gets preloaded + browser-cached.
          Owner action item: if perf becomes a concern, download the
          Satoshi woff2 files into /public/fonts/ and swap to
          next/font/local for proper self-hosting.
        */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className="bg-ink text-paper antialiased">
        {/*
          CartProvider wraps everything so Nav (cart count badge) and
          any product page (add-to-cart) share the same cart state.
          Cart booting (localStorage hydration + Shopify fetch) happens
          inside the provider on mount.
        */}
        <CartProvider>
          <SmoothScrollProvider />
          <Nav />
          {/* Padding-top reserves space for the fixed nav (h-16 mobile,
              h-20 desktop). Pages that need a true full-bleed hero (like
              the landing page) override with negative margin or by
              relying on the nav being transparent at the top. */}
          <main className="min-h-screen">{children}</main>
          <Footer />
          {/* Cart drawer lives at the layout root so it overlays
              everything and is reachable from any page. */}
          <CartDrawer />
          {/* Cookie banner — fixed bottom, first-visit only, see
              component for full cookies/storage audit comment. */}
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
