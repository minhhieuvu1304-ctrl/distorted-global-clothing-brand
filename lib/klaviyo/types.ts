/**
 * Klaviyo API types — distorted.global.
 *
 * Two layers (same pattern as Shopify):
 *   1. Internal request-payload shapes for the few endpoints we hit.
 *   2. App-level `KlaviyoResult<T>` discriminated union returned by
 *      every call so consumers branch on `ok` instead of try/catch.
 *
 * We're using Klaviyo API revision 2024-10-15. Endpoints used:
 *   POST /api/profile-subscription-bulk-create-jobs/
 *     — adds a profile to a list with explicit channel consent
 *       (email and/or SMS). Required for TCPA/GDPR compliance:
 *       SMS in particular requires the consent flag.
 *   POST /api/back-in-stock-subscriptions/
 *     — registers a profile + variant for back-in-stock automation.
 *
 * Reference: https://developers.klaviyo.com/en/v2024-10-15/reference
 */

// ──────────────────────────────────────────────────────────────────────
// Result type
// ──────────────────────────────────────────────────────────────────────

/**
 * Discriminated union — every klaviyoFetch / wrapper returns this.
 * `reason` lets the API route distinguish "infra problem" from
 * "user-actionable problem" so error messages render correctly.
 *
 *   unconfigured — env vars missing; treated as a soft failure
 *                  (form still renders, submit is no-op-ish)
 *   network      — fetch failed or 5xx; user sees "try again later"
 *   validation   — Klaviyo rejected payload (invalid email format
 *                  caught at their server); user sees inline error
 *   duplicate    — profile already subscribed to that list; we
 *                  surface a friendly "already on the list" message
 *   rate-limited — Klaviyo throttled us; surfaces as network err
 */
export type KlaviyoResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason:
        | 'unconfigured'
        | 'network'
        | 'validation'
        | 'duplicate'
        | 'rate-limited';
      error: string;
    };

// ──────────────────────────────────────────────────────────────────────
// Subscribe payload (subscription bulk create jobs)
// ──────────────────────────────────────────────────────────────────────

export interface SubscribeInput {
  email: string;
  /** E.164 phone number including country code, e.g. "+15551234567". */
  phone?: string;
  /** Klaviyo list ID — typically the Early Access list. */
  listId: string;
}

/**
 * The full request body shape Klaviyo expects at
 * /api/profile-subscription-bulk-create-jobs/.
 *
 * The shape is JSON:API style — nested data wrappers mirror what the
 * Klaviyo docs show. We build this in subscribe.ts; this type is
 * exported mainly for the test script.
 */
export interface SubscribeRequestBody {
  data: {
    type: 'profile-subscription-bulk-create-job';
    attributes: {
      profiles: {
        data: Array<{
          type: 'profile';
          attributes: {
            email: string;
            phone_number?: string;
            subscriptions: {
              email?: { marketing: { consent: 'SUBSCRIBED' } };
              sms?: {
                marketing: {
                  consent: 'SUBSCRIBED';
                  consented_at: string; // ISO timestamp
                };
                transactional?: { consent: 'SUBSCRIBED' };
              };
            };
          };
        }>;
      };
      historical_import?: boolean;
    };
    relationships: {
      list: {
        data: { type: 'list'; id: string };
      };
    };
  };
}

// ──────────────────────────────────────────────────────────────────────
// Back-in-stock payload
// ──────────────────────────────────────────────────────────────────────

export interface BackInStockInput {
  email: string;
  /** Shopify variant ID, e.g. "gid://shopify/ProductVariant/12345". */
  variantId: string;
  /**
   * Channels to notify on. Email-only for the inline PDP form
   * (matches the spec's email-only notify-when-available UI).
   */
  channels?: Array<'EMAIL' | 'SMS'>;
}

export interface BackInStockRequestBody {
  data: {
    type: 'back-in-stock-subscription';
    attributes: {
      channels: Array<'EMAIL' | 'SMS'>;
      profile: {
        data: {
          type: 'profile';
          attributes: { email: string };
        };
      };
    };
    relationships: {
      variant: {
        data: { type: 'catalog-variant'; id: string };
      };
    };
  };
}

// ──────────────────────────────────────────────────────────────────────
// API request validation (used by /api routes)
// ──────────────────────────────────────────────────────────────────────

export interface SubscribeApiRequest {
  email: string;
  phone?: string;
}

export interface BackInStockApiRequest {
  email: string;
  /** Product handle for logging/automation context. */
  productHandle: string;
  /** Shopify variant ID. */
  variantId: string;
}
