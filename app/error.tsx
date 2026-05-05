'use client';

import { useEffect } from 'react';

/**
 * Global error boundary.
 *
 * Next.js renders this when an uncaught error escapes a route. Per
 * App Router conventions:
 *   - Must be a Client Component ('use client').
 *   - Receives `error` (the thrown value) and `reset` (callback to
 *     attempt re-rendering the segment that errored).
 *
 * We log the error to the browser console so dev/QA can catch it,
 * but never surface technical details to the user — the visible UI
 * is brand-consistent and apologetic.
 *
 * Spec §16 lists "designed 404 page" as a deferred polish item; the
 * 500 equivalent gets the same minimal treatment for v1.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[error boundary]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center bg-ink pt-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-20 md:px-12">
        <div className="flex flex-col gap-8">
          <p className="font-sans text-caption uppercase tracking-[0.1em] text-steel">
            Error
          </p>
          <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.01em] text-paper md:text-[64px]">
            Something went wrong.
          </h1>
          <p className="max-w-[480px] font-sans text-[14px] leading-relaxed text-mist">
            We&rsquo;ve logged the issue. Try reloading — if it persists, please
            email us.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => reset()}
              className="border border-paper bg-paper px-9 py-3.5 font-sans text-[13px] font-medium uppercase tracking-[0.06em] text-ink transition-all duration-300 ease-out hover:bg-transparent hover:text-paper"
            >
              Try again
            </button>
            <a
              href="/"
              className="font-sans text-[13px] uppercase tracking-[0.06em] text-paper underline-offset-[4px] hover:underline"
            >
              Return home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
