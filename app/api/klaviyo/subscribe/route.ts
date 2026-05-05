import { NextResponse } from 'next/server';
import { subscribeToList } from '@/lib/klaviyo';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/klaviyo/subscribe
 *
 * Server-side endpoint that the <EarlyAccessForm /> component POSTs
 * to. Validates input, rate-limits per IP, calls Klaviyo via the
 * server-only client (private API key never crosses the wire to the
 * browser), and returns a friendly response shape the form maps to
 * UI states.
 *
 * Response shape:
 *   200 { ok: true }
 *   400 { ok: false, error: 'invalid-email' | 'invalid-phone' | 'duplicate' | 'validation' }
 *   429 { ok: false, error: 'rate-limited' }
 *   503 { ok: false, error: 'unavailable' | 'unconfigured' }
 *
 * The form treats any 4xx (except duplicate) as inline-validation,
 * 429 as a transient throttle message, 5xx as a try-again-later.
 */

// Force Node runtime — fetch with 'no-store' + reading process.env
// works under both edge and node, but the in-memory rate limiter
// only meaningfully works on a stable Node instance.
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164 phone — between 8 and 15 digits, optional leading '+'.
// We don't enforce a leading '+' because the EarlyAccessForm builds
// the country code separately and could submit either format.
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

const LIST_ID = process.env.KLAVIYO_LIST_ID_EARLY_ACCESS;

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

  // 3. Server-side configuration check
  if (!LIST_ID) {
    // Misconfigured — log loudly server-side, return generic
    // unavailable to user (don't reveal infrastructure state).
    // eslint-disable-next-line no-console
    console.error(
      '[/api/klaviyo/subscribe] KLAVIYO_LIST_ID_EARLY_ACCESS is not set'
    );
    return NextResponse.json(
      { ok: false, error: 'unavailable' },
      { status: 503 }
    );
  }

  // 4. Call Klaviyo
  const result = await subscribeToList({
    email: email.trim(),
    phone: phone ? phone.replace(/\s/g, '') : undefined,
    listId: LIST_ID,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  // Map Klaviyo failure reasons → response codes + error names
  // the client form already understands.
  switch (result.reason) {
    case 'duplicate':
      return NextResponse.json(
        { ok: false, error: 'duplicate' },
        { status: 200 } // 200 because subscribed-already is "fine" from the user's view
      );
    case 'validation':
      // Klaviyo bounced the payload. Could be a malformed phone we
      // didn't catch or a list-id mismatch. Surface as inline validation.
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
      console.error('[/api/klaviyo/subscribe] Klaviyo not configured');
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

// ──────────────────────────────────────────────────────────────────────
// Body parsing
// ──────────────────────────────────────────────────────────────────────

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
