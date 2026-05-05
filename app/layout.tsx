import type { Metadata, Viewport } from 'next';
import { Inter, Bodoni_Moda } from 'next/font/google';
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
 * Per Prompt deliverable §10: nav + footer global, viewport + favicon
 * + SEO defaults set, locked title and description.
 *
 * Fonts (Prompt deliverable §3):
 *   - Inter via next/font/google, variable weight 100-900.
 *   - Bodoni Moda via next/font/google as the web fallback for the
 *     locked display font "Bodoni 72 Oldstyle". The local Bodoni 72
 *     @font-face declaration in globals.css means Apple users will
 *     see the real Bodoni 72; everyone else gets Bodoni Moda.
 *
 * next/font handles font preloading, FOUT prevention, and CSS variable
 * exposure for us. We attach the variables to <html> so the Tailwind
 * `font-sans` and `font-display` tokens resolve correctly everywhere.
 */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bodoni',
  // Italic is needed for the hero subhead per spec §4.
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
      // Attach next/font CSS variables. The Tailwind font-family
      // tokens reference these names indirectly through the system
      // font stack (the fonts get registered with their actual
      // family names, e.g. 'Inter', so `font-sans` resolves them).
      className={`${inter.variable} ${bodoniModa.variable}`}
    >
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
