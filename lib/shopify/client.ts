/**
 * Shopify Storefront API client.
 *
 * Why fetch-only (no Apollo/urql): we hit ~10 operations total and
 * don't need normalized caching, optimistic updates, or subscriptions.
 * Bundle stays small; the client is ~1KB after minification.
 *
 * Three responsibilities:
 *   1. Build the right URL + headers from env vars.
 *   2. Send the request, parse JSON, surface GraphQL errors.
 *   3. Retry transient network/5xx failures with exponential backoff.
 *
 * The fetch helper returns a discriminated union — never throws on
 * the happy/sad path. Components branch on `result.ok` and either use
 * `result.data` or fall back to the spec'd graceful empty state
 * ("Catalog temporarily unavailable" — Prompt 3 §10).
 *
 * Spec §9: USD only, Shopify Basic plan, Storefront API.
 */

const STOREFRONT_API_VERSION = '2024-10';

// Env vars are NEXT_PUBLIC_-prefixed because the cart mutations need
// to run client-side (cart ID is per-user, lives in localStorage,
// and routes to Shopify-hosted checkout). Storefront tokens are
// designed to be public — they're scoped to read-only product data
// and unauthenticated cart mutations. This matches Shopify's
// own headless examples.
const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

/**
 * Returns true if both required env vars are set. The rest of the
 * data layer checks this before attempting any fetch — when false,
 * we return graceful empty results rather than firing requests at a
 * URL like `https://undefined/api/...`.
 */
export function isShopifyConfigured(): boolean {
  return Boolean(STORE_DOMAIN && STOREFRONT_TOKEN);
}

/**
 * Discriminated union for fetch results. Components check `ok` and
 * branch — never need try/catch around shopifyFetch calls.
 */
export type ShopifyResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      reason: 'unconfigured' | 'network' | 'graphql';
    };

interface ShopifyFetchOptions {
  /** Number of retry attempts on transient failure. Default 2. */
  retries?: number;
  /** Initial backoff in ms; doubles each retry. Default 250. */
  backoffMs?: number;
  /** Pass through to fetch — used by Next caching directives. */
  cache?: RequestCache;
  /** Next.js-specific revalidation for ISR-like caching of catalog data. */
  next?: { revalidate?: number; tags?: string[] };
}

interface ShopifyGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

/**
 * Core fetch helper. Send a query/variables pair, get back a
 * `ShopifyResult<T>`. The generic `T` is the expected `data` shape
 * — caller asserts it; we don't validate at runtime.
 *
 * Retry policy: only retry on (a) network errors, (b) 5xx responses,
 * and (c) Shopify's `THROTTLED` error code. GraphQL errors (bad query,
 * missing field) are NOT retried — those are programmer errors.
 */
export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: ShopifyFetchOptions = {}
): Promise<ShopifyResult<T>> {
  if (!isShopifyConfigured()) {
    return {
      ok: false,
      reason: 'unconfigured',
      error:
        'Shopify env vars not set. Add NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local.',
    };
  }

  const { retries = 2, backoffMs = 250, cache, next } = options;
  const url = `https://${STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`;

  let attempt = 0;
  let lastError = 'Unknown error';

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN!,
        },
        body: JSON.stringify({ query, variables }),
        cache,
        next,
      });

      // 5xx → retry. 4xx → don't retry (it won't get better).
      if (response.status >= 500) {
        lastError = `Shopify ${response.status} ${response.statusText}`;
        attempt++;
        if (attempt <= retries) {
          await sleep(backoffMs * Math.pow(2, attempt - 1));
          continue;
        }
        return { ok: false, reason: 'network', error: lastError };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          ok: false,
          reason: 'network',
          error: `Shopify ${response.status}: ${text || response.statusText}`,
        };
      }

      const json = (await response.json()) as ShopifyGraphQLResponse<T>;

      if (json.errors && json.errors.length > 0) {
        // Shopify's THROTTLED extension is the one GraphQL-level error
        // worth retrying. Everything else is a real query problem.
        const isThrottled = json.errors.some((e) =>
          /throttle/i.test(e.message)
        );
        if (isThrottled && attempt < retries) {
          attempt++;
          await sleep(backoffMs * Math.pow(2, attempt - 1));
          continue;
        }
        return {
          ok: false,
          reason: 'graphql',
          error: json.errors.map((e) => e.message).join('; '),
        };
      }

      if (!json.data) {
        return {
          ok: false,
          reason: 'graphql',
          error: 'Shopify response missing data field.',
        };
      }

      return { ok: true, data: json.data };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      attempt++;
      if (attempt > retries) {
        return { ok: false, reason: 'network', error: lastError };
      }
      await sleep(backoffMs * Math.pow(2, attempt - 1));
    }
  }

  return { ok: false, reason: 'network', error: lastError };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format USD cents into a display string per spec §5:
 *   $420       (whole)
 *   $420.50    (with decimals)
 *
 * Always USD — multi-currency is deferred to post-launch (spec §16).
 */
export function formatPrice(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) return '$0';
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${Math.round(dollars)}`
    : `$${dollars.toFixed(2)}`;
}
