/**
 * ═══════════════════════════════════════════════════════════════════════
 * LOOKBOOK CONFIGURATION (v2 — masonry layout)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Per spec §6 + Prompt 6 + lookbook redesign (Nov 2026), the lookbook
 * is a Pinterest-style dense grid bracketed by a 100vh cover and a
 * closing/Instagram section. Reorderable, expandable.
 *
 * Available section types (defined in /lib/types.ts as LookbookSection):
 *
 *   'cover'       — opening 100vh image with title overlay (FIRST entry)
 *   'masonry'     — Pinterest-style grid; the bulk of the page (~80%)
 *   'text-break'  — compact 30vh Bodoni interruption between masonry blocks
 *
 * Legacy types still available but unused in v2:
 *   'full-bleed-single', 'asymmetric-pair', 'triptych', 'detail-stack'
 *
 * EDITING — common operations:
 *
 *   ➤ Add a new image to the lookbook:
 *     Find any `masonry` section below; append a new item to its
 *     `items` array. Pick an `aspect` to control card height:
 *       'tall'    4:5 portrait (most editorial; default for full looks)
 *       'medium'  5:6 portrait (slightly less elongated)
 *       'short'   4:3 landscape (good for breathing room mid-column)
 *       'square'  1:1 (versatile; great for detail shots)
 *     The grid auto-balances columns by total height — no need to
 *     think about column placement.
 *
 *   ➤ Add a new text break:
 *     Insert a `{ type: 'text-break', copy: '...', align: 'center' }`
 *     between two masonry sections. They stack into the page in order.
 *
 *   ➤ Replace placeholder images with real photography:
 *     Each image has `src` (in-page) and `srcHighRes` (lightbox zoom).
 *     Replace both URLs; leave the structure alone. The owner can
 *     point at Cloudflare Images URLs once those are configured.
 *
 *   ➤ Make the grid denser:
 *     Set `desktopColumns: 4` on a masonry section.
 *     Set it to 2 for a more relaxed grid.
 *
 *   ➤ Reorder sections:
 *     Move entries up/down in the `lookbookSections` array.
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LookbookSection, LookbookImage } from '@/lib/types';
import { shopifyImage } from '@/lib/shopify-images';

// Placeholder image factory — generates picsum URLs from a seed so
// each image is stable across reloads. At launch, replace these
// `src`/`srcHighRes` URLs with real Cloudflare-Images URLs.
function ph(seed: string, alt: string): LookbookImage {
  const base = `https://picsum.photos/seed/${seed}`;
  return {
    src: `${base}/1200/1500`,
    srcHighRes: `${base}/2400/3000`,
    alt,
  };
}

export const lookbookSections: LookbookSection[] = [
  // ══════════════════════════════════════════════════════════════════
  // 1. COVER — full-bleed 100vh hero, AW26 overlay
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'cover',
    image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/aw26.jpg?v=1779879256', 'Campaign cover'),
    title: 'AW26',
    titlePosition: 'bottom-left',
  },

  // ══════════════════════════════════════════════════════════════════
  // 2. OPENING TEXT BREAK — sets the tone before the grid
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'The city as fabric. Worn. Folded. Distorted.',
    align: 'center',
  },

  // ══════════════════════════════════════════════════════════════════
  // 3. FIRST MASONRY BLOCK — 15 cards (full-look establishment)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      // ─────────────────────────────────────────────────────────────
      // PILOT — first real Shopify-hosted image. Validates the
      // shopifyImage() helper end-to-end. To replace with a final
      // production image, swap the URL and alt text. To migrate any
      // other entry in this file, change `ph(...)` to `shopifyImage(...)`
      // and paste the URL from Shopify Admin → Content → Files.
      // ─────────────────────────────────────────────────────────────
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/distorted-graffiti-group-garage.jpg?v=1779879257',
          'lookbook collection'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-street-lamps.jpg?v=1779879257', 'lookbook collection'),
        aspect: 'medium',
      },
      {
        image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/xray-hoodie-logo-garage.jpg?v=1779879257', 'Black hoodie om rooftop'),
        aspect: 'tall',
      },
      {
         image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/sewing-machine-film-setup.jpg?v=1779879257', 'lookbook collection'),
        aspect: 'short',
      },
      {
        image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-outfit-stairwell-lying.jpg?v=1779879257', 'Fashion show'),
        aspect: 'tall',
      },
      {
       image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-event-sunglasses.jpg?v=1779879256', 'Belt showcase'),
        aspect: 'medium',
      },
      {image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/graffiti-wall-action-shot.jpg?v=1779879257', 'Graffiti'), aspect: 'square' },
      {image: shopifyImage('https://cdn.shopify.com/s/files/1/0704/8826/0685/files/hoodie-sunglasses-white-wall.jpg?v=1779879257', 'Standing logo'), aspect: 'tall' },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/hoodie-lying-on-grey-bags.jpg?v=1779879257',
          'Hoodie lying on grey bags'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/four-girls-belts-balcony.jpg?v=1779879258',
          'Four girls belts balcony'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/graffiti-wall-group-horizontal.jpg?v=1779879257',
          'Graffiti wall group horizontal'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/purple-cloud-clothing-rack.jpg?v=1779879257',
          'Purple cloud clothing rack'
        ),
        aspect: 'medium',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-lighter-closeup.jpg?v=1779879257',
          'Black hoodie lighter closeup'
        ),
        aspect: 'square',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/balcony-black-outfit-sky.jpg?v=1779879258',
          'Balcony black outfit sky'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/grey-logo-cap-garden.jpg?v=1779879257',
          'Grey logo cap garden'
        ),
        aspect: 'medium',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 4. INTERLUDE TEXT BREAK
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'Each piece a statement. Each stitch a sentence.',
    align: 'left',
  },

  // ══════════════════════════════════════════════════════════════════
  // 5. SECOND MASONRY BLOCK — 15 cards (mid-collection variety)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-gallery-wall.jpg?v=1779879257',
          'Black hoodie gallery wall'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-group-garage.jpg?v=1779879257',
          'Black hoodie group garage'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-gallery-back.jpg?v=1779879258',
          'Black hoodie gallery back'
        ),
        aspect: 'tall',
      },
      {
        // Tall photo placed in medium slot — mild crop, no extra
        // short-aspect slot was available in this batch.
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/rooftop-night-city-hoodie.jpg?v=1779880430',
          'Rooftop night city hoodie'
        ),
        aspect: 'medium',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-cutout-template-closeup.jpg?v=1779879258',
          'Black cutout template closeup'
        ),
        aspect: 'square',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-rooftop-back.jpg?v=1779879257',
          'Black hoodie rooftop back'
        ),
        aspect: 'tall',
      },
      {
        // Tall photo placed in medium slot — mild crop.
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-street-sunglasses.jpg?v=1779880430',
          'Black hoodie street sunglasses'
        ),
        aspect: 'medium',
      },
      {
        // Screenshot PNG — flagged for quality review against
        // professional photography. Easy to swap out later.
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/hoodie-duo-parking-garage-screenshot.png?v=1779879258',
          'Hoodie duo parking garage'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/white-symbol-jacket-patio.jpg?v=1779879258',
          'White symbol jacket patio'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-leaf-cutouts-mat.jpg?v=1779879258',
          'Black leaf cutouts mat'
        ),
        aspect: 'square',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/hoodie-cap-event-wall.jpg?v=1779879257',
          'Hoodie cap event wall'
        ),
        aspect: 'tall',
      },
      {
        // Tall photo placed in medium slot — mild crop.
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/cathedral-plaza-hoodie-cap.jpg?v=1779880430',
          'Cathedral plaza hoodie cap'
        ),
        aspect: 'medium',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/graffiti-group-wall-night.jpg?v=1779880429',
          'Graffiti group wall night'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/black-hoodie-lamp-columns.jpg?v=1779880429',
          'Black hoodie lamp columns'
        ),
        aspect: 'tall',
      },
      { image: ph('look-17', 'Look 17 — quiet portrait'), aspect: 'medium' },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 6. CLOSING INTERLUDE
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'text-break',
    copy: 'An experience far beyond fabrics.',
    align: 'center',
  },

  // ══════════════════════════════════════════════════════════════════
  // 7. THIRD MASONRY BLOCK — 12 cards (denser closing rhythm)
  // ══════════════════════════════════════════════════════════════════
  {
    type: 'masonry',
    desktopColumns: 3,
    items: [
      {
        image: ph('look-18', 'Look 18 — full crew, exterior'),
        aspect: 'medium',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/kitchen-floor-grey-outfit.jpg?v=1779880430',
          'Kitchen floor grey outfit'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/low-angle-hoodie-red-belt.jpg?v=1779880430',
          'Low angle hoodie red belt'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/leopard-belt-closeup.jpg?v=1779880430',
          'Leopard belt closeup'
        ),
        aspect: 'square',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/hoodie-night-temple-columns.jpg?v=1779880430',
          'Hoodie night temple columns'
        ),
        aspect: 'tall',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/white-logo-shirt-floor.jpg?v=1779880430',
          'White logo shirt floor'
        ),
        aspect: 'short',
      },
      {
        image: ph('look-22', 'Look 22 — group, three subjects'),
        aspect: 'medium',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/assorted-belts-worktable.jpg?v=1779880430',
          'Assorted belts worktable'
        ),
        aspect: 'square',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/studio-hoodie-logo-back.jpg?v=1779880430',
          'Studio hoodie logo back'
        ),
        aspect: 'tall',
      },
      {
        image: ph('look-24', 'Look 24 — closing motion shot'),
        aspect: 'medium',
      },
      {
        // Screenshot PNG — flagged for quality review.
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/parking-garage-hoodie-duo-screenshot.png?v=1779880431',
          'Parking garage hoodie duo'
        ),
        aspect: 'short',
      },
      {
        image: shopifyImage(
          'https://cdn.shopify.com/s/files/1/0704/8826/0685/files/coastal-rocks-hoodie-back.jpg?v=1779880430',
          'Coastal rocks hoodie back'
        ),
        aspect: 'tall',
      },
    ],
  },
];
