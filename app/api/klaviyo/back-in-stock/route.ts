import { NextResponse } from 'next/server';
import { subscribeCustomer } from '@/lib/shopify/customers';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/klaviyo/back-in-stock
 *
 * Note: route path kept for backwards compatibility with the frontend
 * form, but the backend now uses SHOPIFY (not Klaviyo).
 *
 * The PDP "Notify me when available" form POSTs here when a customer
 * requests notification on a sold-out variant.
 *
 * Body: { email, productHandle, variantId }
 *   - email          customer email (required, validated)
 *   - productHandle  Shopify handle for the product they want notified
 *                    about. Used to tag the customer with
 *                    "back-in-stock-{handle}" so the brand owner can
 *                    filter/target them in Shopify Admin when they
 *                    restock that item.
 *   - variantId      Shopify global ID like
 *                    "gid://shopify/ProductVariant/12345". Recorded on
 *                    the customer's note field so the owner knows the
 *                    exact variant, not just the product.
 *
 * Sending the actual restock notification is a manual/scheduled step
 * the brand owner performs — either from Shopify Admin (filter by tag,
 * send email via Shopify Email) or via a connected marketing app.
 */

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

  // 3. Build tags + note.
  //    Tag: "back-in-stock-{handle}" so the owner can filter later.
  //    Note: variant id so they know the exact variant.
  const extraTags = parsed.productHandle
    ? [`back-in-stock-${parsed.productHandle}`]
    : ['back-in-stock'];
  const note = `Back in stock request: variant ${parsed.variantId}${
    parsed.productHandle ? ` (${parsed.productHandle})` : ''
  }`;

  // 4. Call Shopify Admin API via the shared customers helper.
  const result = await subscribeCustomer({
    email: parsed.email.trim(),
    extraTags,
    note,
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

  switch (result.reason) {
    case 'duplicate':
      // Already exists — from user's perspective they're on the list.
      // Note: doesn't append the new tag to existing customer.
      // For a v1 this is acceptable; a future refinement would use
      // customerUpdate to add the tag if not already present.
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
      console.error(
        '[/api/klaviyo/back-in-stock] Shopify Dev Dashboard OAuth not configured'
      );
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
