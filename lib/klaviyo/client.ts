/**
 * Klaviyo API fetch helper.
 *
 * Server-only. Uses the private API key (NOT the public one) and so
 * MUST never be imported from a client component. The /api/klaviyo/*
 * routes are the only consumers; client forms POST to those routes.
 *
 * Why a custom fetch wrapper instead of the official @klaviyo/api-client
 * SDK: the SDK is heavy, weakly typed, and our surface is just two
 * endpoints. A 100-line fetch wrapper is faster, smaller, and easier
 * to reason about for graceful-degradation behavior.
 *
 * Returns a discriminated `KlaviyoResult<T>` — never throws on the
 * failure path. Caller branches on `result.ok`.
 *
 * Retries: 5xx and explicit `rate-limited` get one retry with 500ms
 * backoff. 4xx (bad payload, duplicate, validation) do not retry —
 * they won't get better.
 *
 * Spec §9 names Klaviyo as the email + SMS provider. API revision
 * pinned to 2024-10-15 for stability.
 */

import type { KlaviyoResult } from './types';

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2024-10-15';

const PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;

/** True if the server-side env var is set and looks plausible. */
export function isKlaviyoConfigured(): boolean {
  return Boolean(PRIVATE_KEY && PRIVATE_KEY.startsWith('pk_'));
}

interface KlaviyoFetchOptions {
  retries?: number;
  backoffMs?: number;
}

/**
 * Send a request to a Klaviyo endpoint.
 *
 * @param path     Endpoint path, e.g. "/profile-subscription-bulk-create-jobs/".
 *                 The leading "/api" base is added internally.
 * @param body     JSON:API style request body.
 * @param options  retries (default 1), backoffMs (default 500).
 *
 * The generic T is the type of the parsed JSON `data` field on
 * success. For endpoints that return 202 with no body (the bulk-create
 * jobs endpoint queues async work), pass `unknown` and ignore the
 * payload — the absence of an error is success.
 */
export async function klaviyoFetch<T = unknown>(
  path: string,
  body: unknown,
  options: KlaviyoFetchOptions = {}
): Promise<KlaviyoResult<T>> {
  if (!isKlaviyoConfigured()) {
    return {
      ok: false,
      reason: 'unconfigured',
      error:
        'Klaviyo not configured. Set KLAVIYO_PRIVATE_KEY in .env.local — see .env.example.',
    };
  }

  const { retries = 1, backoffMs = 500 } = options;
  const url = `${KLAVIYO_API_BASE}${path}`;

  let attempt = 0;
  let lastError = 'Unknown error';

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // Klaviyo's auth header format — not a Bearer token.
          Authorization: `Klaviyo-API-Key ${PRIVATE_KEY!}`,
          'Content-Type': 'application/json',
          accept: 'application/json',
          revision: KLAVIYO_API_REVISION,
        },
        body: JSON.stringify(body),
        // Never cache write requests.
        cache: 'no-store',
      });

      // 202 Accepted — the bulk-create-jobs endpoint queues work and
      // returns 202 with no body. Treat as success.
      if (response.status === 202) {
        return { ok: true, data: undefined as T };
      }

      // 2xx with body
      if (response.ok) {
        const json = (await response.json().catch(() => null)) as T | null;
        return { ok: true, data: (json ?? (undefined as unknown)) as T };
      }

      // 429 — rate limited by Klaviyo. Single retry, then give up.
      if (response.status === 429) {
        lastError = `Klaviyo rate-limited`;
        if (attempt < retries) {
          attempt++;
          await sleep(backoffMs * attempt);
          continue;
        }
        return { ok: false, reason: 'rate-limited', error: lastError };
      }

      // 5xx — transient; retry once.
      if (response.status >= 500) {
        lastError = `Klaviyo ${response.status} ${response.statusText}`;
        if (attempt < retries) {
          attempt++;
          await sleep(backoffMs * attempt);
          continue;
        }
        return { ok: false, reason: 'network', error: lastError };
      }

      // 4xx — payload problem. Klaviyo returns JSON:API errors with
      // useful detail in `errors[].detail`. Parse, classify, surface.
      const errBody = await response.json().catch(() => ({}));
      const detail = extractFirstErrorDetail(errBody);
      const reason = classify4xxError(response.status, detail);
      return {
        ok: false,
        reason,
        error: detail || `Klaviyo ${response.status}`,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      attempt++;
      if (attempt > retries) {
        return { ok: false, reason: 'network', error: lastError };
      }
      await sleep(backoffMs * attempt);
    }
  }

  return { ok: false, reason: 'network', error: lastError };
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface JsonApiErrorEnvelope {
  errors?: Array<{
    code?: string;
    detail?: string;
    title?: string;
  }>;
}

/** Pull the first usable error message from a Klaviyo 4xx response. */
function extractFirstErrorDetail(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const errs = (body as JsonApiErrorEnvelope).errors;
  if (!Array.isArray(errs) || errs.length === 0) return '';
  const first = errs[0];
  return first?.detail ?? first?.title ?? '';
}

/**
 * Map a 4xx response to our internal `reason` taxonomy. Klaviyo
 * surfaces "duplicate profile in list" as a 400 with a specific
 * detail string — we sniff for it so the UI can render the
 * "you're already on the list" friendly message.
 */
function classify4xxError(
  status: number,
  detail: string
): 'duplicate' | 'validation' {
  const low = detail.toLowerCase();
  if (status === 409 || low.includes('already') || low.includes('duplicate')) {
    return 'duplicate';
  }
  return 'validation';
}
