// lib/shopify/customers.ts
// ═══════════════════════════════════════════════════════════════════════
// Shopify customer creation — Admin API via the 2026 Dev Dashboard flow.
//
// This module handles marketing signups (Member Access + back-in-stock),
// replacing the earlier Klaviyo path. It talks to Shopify's Admin API
// GraphQL endpoint using short-lived access tokens obtained via OAuth's
// client_credentials grant.
//
// ─────────────────────────────────────────────────────────────────────
// WHY OAUTH INSTEAD OF A STATIC TOKEN
// ─────────────────────────────────────────────────────────────────────
// Before January 1, 2026, custom apps in Shopify Admin exposed a static
// `shpat_...` access token you could paste into an env var and use
// forever. That flow is deprecated. New apps created via the Dev
// Dashboard expose only a Client ID + Client Secret; access tokens must
// be obtained by hitting Shopify's OAuth endpoint at request time and
// they expire after ~24 hours. We cache the token in memory between
// exchanges to avoid the round-trip on every form submit.
//
// ─────────────────────────────────────────────────────────────────────
// REQUIRED ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────────────────────────────
//   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
//     e.g. "distorted-global.myshopify.com". Same value the Storefront
//     API uses. Public is fine (the domain itself isn't a secret).
//
//   SHOPIFY_APP_CLIENT_ID
//     From Shopify Dev Dashboard → your app → API credentials. Public
//     side of the OAuth pair. Server-only here for tidiness.
//
//   SHOPIFY_APP_CLIENT_SECRET
//     From the same Dev Dashboard page. PRIVATE — never expose to the
//     browser. Do not prefix with NEXT_PUBLIC_.
//
// If any of these are missing, functions return
// `{ ok: false, reason: 'unconfigured' }` rather than throwing. The
// API routes map that to a 503 that the form shows as "temporarily
// unavailable" — keeps the site functional during initial setup.
//
// ─────────────────────────────────────────────────────────────────────
// CROSS-ORGANIZATION CAVEAT
// ─────────────────────────────────────────────────────────────────────
// client_credentials only works when the app and the store are in the
// same Shopify organization. Since we're building for a client's own
// store using their own Dev Dashboard app, this holds. If we ever need
// to authenticate against a store in a different organization, switch
// to Token Exchange or Authorization Code Grant instead — same module,
// different exchange step. See Shopify's "Token Exchange" docs.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Discriminated union so the API route can map cleanly to HTTP codes.
 * Mirrors the shape the previous Klaviyo implementation returned so
 * the routes and forms keep working without changes.
 */
export type CustomerSubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'duplicate' // email already exists as a Shopify customer
        | 'validation' // Shopify rejected the payload (bad email, etc.)
        | 'unconfigured' // env vars missing
        | 'rate-limited' // Shopify Admin API rate limit
        | 'network'; // anything else
      error: string;
    };

export interface SubscribeCustomerInput {
  email: string;
  /** E.164 format, e.g. "+12025551234". Optional. */
  phone?: string;
  /**
   * Extra tags to append to the customer beyond the default
   * "member-access". Used by the back-in-stock flow to attach a
   * "back-in-stock-{handle}" marker so the brand can later notify
   * the right people when a specific product restocks.
   */
  extraTags?: string[];
  /** Free-form Shopify customer note (e.g. variant ID they want notified about). */
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────

const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_APP_CLIENT_SECRET;

// Pin the Admin API version. Bump intentionally when adopting new fields.
// 2025-01 supports emailMarketingConsent / smsMarketingConsent on
// customerCreate; earlier versions use a deprecated shape.
const ADMIN_API_VERSION = '2025-01';

function shopHost(): string | null {
  if (!STORE_DOMAIN) return null;
  return STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

function isConfigured(): boolean {
  return Boolean(shopHost() && CLIENT_ID && CLIENT_SECRET);
}

// ─────────────────────────────────────────────────────────────────────
// Token cache (module-scoped)
// ─────────────────────────────────────────────────────────────────────
//
// Access tokens from client_credentials last ~24 hours. We refresh at
// 23 hours to be safe. Cache lives in module scope so the same token
// is reused across requests within a single serverless instance. On
// Vercel each cold-start gets its own cache — that's fine, worst case
// is an extra token exchange per instance boot.

interface CachedToken {
  token: string;
  expiresAt: number; // ms epoch
}

let cachedToken: CachedToken | null = null;

async function getAdminAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; reason: 'unconfigured' | 'network'; error: string }
> {
  if (!isConfigured()) {
    return {
      ok: false,
      reason: 'unconfigured',
      error: 'Shopify Dev Dashboard OAuth credentials are not configured.',
    };
  }

  const now = Date.now();
  // Return cached token if it's still valid with 60s of headroom.
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return { ok: true, token: cachedToken.token };
  }

  const host = shopHost();
  const tokenUrl = `https://${host}/admin/oauth/access_token`;

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
      // Never cache OAuth token exchanges.
      cache: 'no-store',
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      reason: 'network',
      error: `Token exchange failed: HTTP ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  let data: { access_token?: string; expires_in?: number };
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      reason: 'network',
      error: 'Token exchange returned non-JSON.',
    };
  }

  if (!data.access_token) {
    return {
      ok: false,
      reason: 'network',
      error: 'Token exchange returned no access_token.',
    };
  }

  // Shopify returns expires_in in seconds. Default to 23h if missing
  // (the docs say 24h; we're conservative).
  const expiresInMs = (data.expires_in ?? 23 * 60 * 60) * 1000;
  cachedToken = {
    token: data.access_token,
    expiresAt: now + expiresInMs,
  };

  return { ok: true, token: data.access_token };
}

// ─────────────────────────────────────────────────────────────────────
// customerCreate — Admin API GraphQL mutation
// ─────────────────────────────────────────────────────────────────────
//
// Adds a customer with optional marketing consent. Tags are how we
// segment members in Shopify Admin (e.g. "member-access",
// "back-in-stock-{handle}"). Customers appear immediately under the
// Customers tab and are targetable from Shopify Email or any third-
// party marketing app the client connects later.
//
// Consent defaults:
//   emailMarketingConsent → SUBSCRIBED + SINGLE_OPT_IN
//   smsMarketingConsent   → SUBSCRIBED + SINGLE_OPT_IN (only when phone provided)
//
// SINGLE_OPT_IN over CONFIRMED_OPT_IN because the form already shows
// a consent disclosure. If the brand ever expands into EU-regulated
// jurisdictions we may need to switch to CONFIRMED_OPT_IN.

const CUSTOMER_CREATE_MUTATION = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface CustomerCreateResponse {
  customerCreate: {
    customer: { id: string; email: string } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public function
// ─────────────────────────────────────────────────────────────────────

/**
 * Subscribe a customer to Member Access (and any extra tags provided).
 *
 * Idempotency: if the email is already a Shopify customer, we return
 * `reason: 'duplicate'`. The API route maps that to a 200 (from the
 * user's perspective they're on the list either way).
 */
export async function subscribeCustomer(
  input: SubscribeCustomerInput
): Promise<CustomerSubscribeResult> {
  const tokenResult = await getAdminAccessToken();
  if (!tokenResult.ok) {
    return { ok: false, reason: tokenResult.reason, error: tokenResult.error };
  }

  const host = shopHost();
  const endpoint = `https://${host}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

  const tags = ['member-access', ...(input.extraTags ?? [])];

  const customerInput: Record<string, unknown> = {
    email: input.email,
    tags,
    emailMarketingConsent: {
      marketingState: 'SUBSCRIBED',
      marketingOptInLevel: 'SINGLE_OPT_IN',
    },
  };

  if (input.phone) {
    customerInput.phone = input.phone;
    customerInput.smsMarketingConsent = {
      marketingState: 'SUBSCRIBED',
      marketingOptInLevel: 'SINGLE_OPT_IN',
    };
  }

  if (input.note) {
    customerInput.note = input.note;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': tokenResult.token,
      },
      body: JSON.stringify({
        query: CUSTOMER_CREATE_MUTATION,
        variables: { input: customerInput },
      }),
      cache: 'no-store',
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'network',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      reason: 'rate-limited',
      error: 'Shopify Admin API rate limit hit.',
    };
  }

  // 401/403 usually mean the cached token expired or scopes were
  // changed. Blow away the cache so the next request re-exchanges.
  if (response.status === 401 || response.status === 403) {
    cachedToken = null;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      reason: 'network',
      error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  let json: { data?: CustomerCreateResponse; errors?: unknown };
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      reason: 'network',
      error: 'Could not parse Shopify response as JSON.',
    };
  }

  if (json.errors) {
    const msg = Array.isArray(json.errors)
      ? json.errors
          .map((e: unknown) => String((e as { message: string }).message))
          .join('; ')
      : String(json.errors);
    return { ok: false, reason: 'validation', error: msg };
  }

  const result = json.data?.customerCreate;
  if (!result) {
    return {
      ok: false,
      reason: 'network',
      error: 'Empty response from Shopify customerCreate.',
    };
  }

  if (result.userErrors.length > 0) {
    const firstError = result.userErrors[0];
    const msg = firstError.message.toLowerCase();
    if (
      msg.includes('already been taken') ||
      msg.includes('already exists') ||
      msg.includes('has already been')
    ) {
      return { ok: false, reason: 'duplicate', error: firstError.message };
    }
    return { ok: false, reason: 'validation', error: firstError.message };
  }

  if (!result.customer) {
    return {
      ok: false,
      reason: 'network',
      error: 'Shopify returned no userErrors but also no customer.',
    };
  }

  return { ok: true };
}
