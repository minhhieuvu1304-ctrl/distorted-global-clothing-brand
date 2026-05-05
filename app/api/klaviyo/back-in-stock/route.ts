import { NextResponse } from 'next/server';
import { triggerBackInStock } from '@/lib/klaviyo';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/klaviyo/back-in-stock
 *
 * The PDP "Notify me when available" form POSTs here when a customer
 * requests notification on a sold-out variant.
 *
 * Body: { email, productHandle, variantId }
 *   - email          customer email (required, validated)
 *   - productHandle  Shopify handle, kept for server-side logging /
 *                    future analytics — not sent to Klaviyo. Klaviyo
 *                    only needs the variantId since the back-in-stock
 *                    automation is keyed on that.
 *   - variantId      Shopify global ID like
 *                    "gid://shopify/ProductVariant/12345"
 *
 * Same response shape and rate limit (5/min/IP) as /subscribe.
 */

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Shopify variant IDs come through the cart layer as Storefront
// global IDs. We accept both the raw numeric form and the gid form.
const VARIANT_ID_RE = /^(gid:\/\/shopify\/ProductVariant\/)?\d+$/;

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

  const parsed = parseBackInStockBody(body);

  if (!parsed.email || !EMAIL_RE.test(parsed.email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid-email' },
      { status: 400 }
    );
  }
  if (!parsed.variantId || !VARIANT_ID_RE.test(parsed.variantId)) {
    return NextResponse.json(
      { ok: false, error: 'validation' },
      { status: 400 }
    );
  }

  // 3. Call Klaviyo
  const result = await triggerBackInStock({
    email: parsed.email.trim(),
    variantId: parsed.variantId,
    // Email-only — the PDP form only collects an email per spec §5.
    channels: ['EMAIL'],
  });

  if (result.ok) {
    // eslint-disable-next-line no-console
    console.info(
      '[/api/klaviyo/back-in-stock] subscribed',
      parsed.productHandle ?? '(no handle)',
      parsed.variantId
    );
    return NextResponse.json({ ok: true });
  }

  // Map failures.
  switch (result.reason) {
    case 'duplicate':
      // Already subscribed for this variant — fine from user's view.
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    case 'validation':
      // eslint-disable-next-line no-console
      console.error('[/api/klaviyo/back-in-stock] validation:', result.error);
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
      console.error('[/api/klaviyo/back-in-stock] Klaviyo not configured');
      return NextResponse.json(
        { ok: false, error: 'unconfigured' },
        { status: 503 }
      );
    case 'network':
    default:
      // eslint-disable-next-line no-console
      console.error('[/api/klaviyo/back-in-stock] network:', result.error);
      return NextResponse.json(
        { ok: false, error: 'unavailable' },
        { status: 503 }
      );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Body parsing
// ──────────────────────────────────────────────────────────────────────

interface ParsedBackInStockBody {
  email: string;
  productHandle?: string;
  variantId: string;
}

function parseBackInStockBody(body: unknown): ParsedBackInStockBody {
  if (!body || typeof body !== 'object') {
    return { email: '', variantId: '' };
  }
  const b = body as Record<string, unknown>;
  return {
    email: typeof b.email === 'string' ? b.email : '',
    productHandle:
      typeof b.productHandle === 'string' ? b.productHandle : undefined,
    variantId: typeof b.variantId === 'string' ? b.variantId : '',
  };
}
