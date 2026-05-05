/**
 * Rate limiting for Klaviyo write endpoints.
 *
 * In-memory sliding window keyed by IP. 5 requests per minute per IP
 * by default — sufficient to block bot floods on the public Early
 * Access form without inconveniencing real users.
 *
 * SCALING NOTE: this works on a single Vercel function instance
 * (which most low-traffic deployments are) but does NOT coordinate
 * across instances. For multi-instance scale, swap the in-memory
 * Map for an Upstash Redis or Vercel KV backend — the public
 * `checkRateLimit()` API stays the same. v1 launch volume per spec
 * (a luxury catalog, ~50 products, drop-driven traffic spikes) is
 * well within single-instance territory.
 *
 * Window cleanup: stale entries are evicted lazily on each check —
 * no separate timer needed.
 */

interface RateLimitOptions {
  /** Window size in ms. Default 60_000 (1 minute). */
  windowMs?: number;
  /** Max requests allowed per window. Default 5. */
  max?: number;
}

interface RateLimitResult {
  /** True if the request is allowed. */
  ok: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix ms when the window resets. */
  resetAt: number;
}

/**
 * Map of IP → list of request timestamps (ms). We trim entries
 * older than `windowMs` on each call. Module-scoped Map — Node
 * keeps it alive across requests in the same function instance.
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 5;
  const now = Date.now();
  const cutoff = now - windowMs;

  // Pull current timestamps, drop stale, then decide.
  const timestamps = hits.get(ip)?.filter((t) => t > cutoff) ?? [];

  if (timestamps.length >= max) {
    // Soonest reset is the oldest in-window timestamp + windowMs.
    const oldest = timestamps[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  timestamps.push(now);
  hits.set(ip, timestamps);

  return {
    ok: true,
    remaining: max - timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Extract a usable client IP from a Next.js Request.
 *
 * Vercel + most edges populate `x-forwarded-for` with a comma-
 * separated chain; the leftmost entry is the real client. Falls back
 * to `x-real-ip`, then to a generic 'unknown' bucket so unattributed
 * requests still get rate-limited (rather than slipping through).
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
