import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/cn';

/**
 * Closing
 *
 * Spec §6 + Prompt 6 §5. Final lookbook section before the global
 * footer. ~60vh, restrained — the lookbook is editorial, so the
 * single egress to commerce ("Shop the Collection →") is deliberately
 * discreet rather than promotional.
 *
 * Credits line is optional and config-driven via
 * `siteConfig.lookbook.credits`. Empty string hides the row entirely.
 */
export function Closing() {
  const { closingCta, credits } = siteConfig.lookbook;

  return (
    <section
      aria-label="Lookbook closing"
      className="flex min-h-[60vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <div className="flex flex-col gap-12">
          {credits && (
            <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-steel">
              {credits}
            </p>
          )}
          <Link
            href={closingCta.href}
            className={cn(
              'inline-flex items-center gap-2 self-start',
              'font-sans text-[13px] uppercase tracking-[0.08em] text-paper',
              'underline-offset-[4px] transition-all duration-300 ease-out',
              'hover:underline'
            )}
          >
            {closingCta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
