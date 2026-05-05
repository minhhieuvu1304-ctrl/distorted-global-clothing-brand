/**
 * Klaviyo integration barrel — server-only.
 *
 *   import { subscribeToList, triggerBackInStock } from '@/lib/klaviyo';
 *
 * NEVER import this from a client component — the underlying fetch
 * helper reads `KLAVIYO_PRIVATE_KEY` from process.env. Always go
 * through the /api/klaviyo/* routes from the browser.
 */

export type { KlaviyoResult, SubscribeInput, BackInStockInput } from './types';
export { isKlaviyoConfigured } from './client';
export { subscribeToList, buildSubscribePayload } from './subscribe';
export { triggerBackInStock, buildBackInStockPayload } from './backInStock';
