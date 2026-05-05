import Link from 'next/link';

/**
 * 404 page.
 *
 * Spec §16 lists a "designed 404 page" as a deferred post-launch
 * polish item; for v1 we ship this minimal-but-on-brand placeholder.
 * It uses the same vocabulary as error.tsx (Bodoni headline, ghost
 * Inter return-home link) so the two pages feel consistent.
 *
 * Server component — no client interactivity needed.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-ink pt-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-20 md:px-12">
        <div className="flex flex-col gap-8">
          <p className="font-sans text-caption uppercase tracking-[0.1em] text-steel">
            404
          </p>
          <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.01em] text-paper md:text-[64px]">
            Not found.
          </h1>
          <p className="max-w-[480px] font-sans text-[14px] leading-relaxed text-mist">
            The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
          </p>
          <Link
            href="/"
            className="self-start font-sans text-[13px] uppercase tracking-[0.06em] text-paper underline-offset-[4px] hover:underline"
          >
            Return home →
          </Link>
        </div>
      </div>
    </main>
  );
}
