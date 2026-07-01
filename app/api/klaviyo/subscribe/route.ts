import { NextResponse } from 'next/server';
import { subscribeCustomer } from '@/lib/shopify/customers';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/klaviyo/subscribe
 *
 * Note: route path kept for backwards compatibility with the frontend
 * form, but the backend now uses SHOPIFY (not Klaviyo). The name is
 * vestigial and will be renamed in a future cleanup.
 *
 * Server-side endpoint that <EarlyAccessForm /> POSTs to. Validates,
 * rate-limits per IP, calls Shopify Admin API via the server-only
 * customers helper (OAuth Client Secret never crosses the wire to
 * the browser), and returns a friendly shape the form maps to UI states.
 *
 * Response shape (unchanged so the form doesn't need updating):
 *   200 { ok: true }
 *   400 { ok: false, error: 'invalid-email' | 'invalid-phone' | 'duplicate' | 'validation' }
 *   429 { ok: false, error: 'rate-limited' }
 *   503 { ok: false, error: 'unavailable' | 'unconfigured' }
 */

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

export async function POST(request: Request) {
  // 1. Rate limit
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate-limited' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'validation' },
      { status: 400 }
    );
  }

  const { email, phone } = parseSubscribeBody(body);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid-email' },
      { status: 400 }
    );
  }
  if (phone && !PHONE_RE.test(phone.replace(/\s/g, ''))) {
    return NextResponse.json(
      { ok: false, error: 'invalid-phone' },
      { status: 400 }
    );
  }

  // 3. Call Shopify Admin API
  const result = await subscribeCustomer({
    email: email.trim(),
    phone: phone ? normalizePhone(phone) : undefined,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  switch (result.reason) {
    case 'duplicate':
      // 200 because "already subscribed" is a fine outcome from the
      // user's perspective (they're on the list either way).
      return NextResponse.json(
        { ok: false, error: 'duplicate' },
        { status: 200 }
      );
    case 'validation':
      // eslint-disable-next-line no-console
      console.error('[/api/klaviyo/subscribe] validation:', result.error);
      return NextResponse.json(
        { ok: false, error: 'validation' },
        { status: 400 }
      );
    case 'rate-limited':
      return NextResponse.json(
        { ok: false, error: 'rate-limited' },
        { status: 429 }
      );
    case 'unconfigured':
      // eslint-disable-next-line no-console
      console.error(
        '[/api/klaviyo/subscribe] Shopify Dev Dashboard OAuth not configured'
      );
      return NextResponse.json(
        { ok: false, error: 'unconfigured' },
        { status: 503 }
      );
    case 'network':
    default:
      // eslint-disable-next-line no-console
      console.error('[/api/klaviyo/subscribe] network:', result.error);
      return NextResponse.json(
        { ok: false, error: 'unavailable' },
        { status: 503 }
      );
  }
}

interface ParsedSubscribeBody {
  email: string;
  phone?: string;
}

function parseSubscribeBody(body: unknown): ParsedSubscribeBody {
  if (!body || typeof body !== 'object') return { email: '' };
  const b = body as Record<string, unknown>;
  return {
    email: typeof b.email === 'string' ? b.email : '',
    phone: typeof b.phone === 'string' ? b.phone : undefined,
  };
}

/**
 * Normalize a phone number to E.164. The EarlyAccessForm may submit
 * "+1 202 555 1234" or "12025551234" — Shopify wants strict E.164.
 */
function normalizePhone(raw: string): string {
  const stripped = raw.replace(/\s/g, '');
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}
