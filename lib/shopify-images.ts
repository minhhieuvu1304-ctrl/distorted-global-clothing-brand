// lib/shopify-images.ts
// ═══════════════════════════════════════════════════════════════════════
// Shopify Files → LookbookImage helper
// ═══════════════════════════════════════════════════════════════════════
//
// Photography for the lookbook lives on the store's Shopify CDN, uploaded
// via Admin → Content → Files. This helper turns a single Shopify URL
// into the LookbookImage shape the lookbook expects (with in-page and
// lightbox sizes).
//
// USAGE
//   In config/lookbook.config.ts:
//
//     import { shopifyImage } from '@/lib/shopify-images';
//
//     {
//       image: shopifyImage(
//         'https://cdn.shopify.com/s/files/1/.../look-01-front.jpg?v=1779796639',
//         'Look 01 — front'
//       ),
//       aspect: 'tall',
//     }
//
//   To get the URL: Shopify Admin → Content → Files → click the file →
//   copy the link. Paste it here as-is, version param and all.
//
// HOW IT WORKS
//   Shopify CDN supports on-the-fly resizing via filename suffix:
//
//     look-01.jpg          → original (whatever you uploaded)
//     look-01_1200x.jpg    → resized to 1200px wide
//     look-01_2400x.jpg    → resized to 2400px wide
//
//   This helper parses your URL, splits filename + extension, and
//   generates the two sized variants (in-page + lightbox) automatically.
//   You upload one master file at high resolution and Shopify handles
//   the rest. No need to export multiple sizes manually.
//
// ═══════════════════════════════════════════════════════════════════════

import type { LookbookImage } from '@/lib/types';

/**
 * In-page card width (px). The largest masonry card on desktop is
 * around 600px CSS wide; 1200px source gives crisp retina rendering
 * without over-fetching bytes.
 */
const SRC_WIDTH = 1200;

/**
 * Lightbox zoom width (px). Fills a desktop viewport comfortably and
 * holds up to a fashion-detail level of scrutiny without bloating
 * payload.
 */
const HIGH_RES_WIDTH = 2400;

/**
 * Build a LookbookImage from a Shopify Files URL.
 *
 * Throws if the URL doesn't parse cleanly — failing the build loudly
 * is preferable to silently serving broken images.
 */
export function shopifyImage(url: string, alt: string): LookbookImage {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/');
  const filename = segments[segments.length - 1];
  const dir = segments.slice(0, -1).join('/');
  const version = parsed.searchParams.get('v');

  const match = filename.match(/^(.+)\.(jpe?g|png|webp)$/i);
  if (!match) {
    throw new Error(
      `shopifyImage: cannot parse extension from "${filename}". ` +
        `Expected a .jpg, .jpeg, .png, or .webp file.`
    );
  }
  const [, stem, ext] = match;
  const versionParam = version ? `?v=${version}` : '';

  const sized = (width: number): string =>
    `${parsed.protocol}//${parsed.host}${dir}/${stem}_${width}x.${ext}${versionParam}`;

  return {
    src: sized(SRC_WIDTH),
    srcHighRes: sized(HIGH_RES_WIDTH),
    alt,
  };
}
