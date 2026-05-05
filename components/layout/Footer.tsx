import Link from 'next/link';
import { Logo } from './Logo';
import { siteConfig, type FooterLink } from '@/config/site.config';

/**
 * Footer
 *
 * Per spec §3 + Prompt deliverable §6:
 *   - Solid `--ink` background, 96px+ vertical padding.
 *   - 4-column grid on desktop, single-column stack on mobile.
 *   - Wordmark left, emblem right (emblem is a placeholder for now —
 *     spec §15 lists the secondary mon emblem as owner-provided
 *     separately. We render an empty space-reserving slot so the
 *     layout doesn't shift when it arrives).
 *   - Bottom row: copyright left, Privacy + Terms right.
 *   - All link text in Inter, 12-13px.
 *
 * All copy and structure is driven by siteConfig.footer — no
 * hard-coded strings here.
 */
export function Footer() {
  const { footer } = siteConfig;

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1680px] px-4 py-24 md:px-6 md:py-28 lg:py-32">
        {/* Top row: wordmark + emblem placeholder */}
        <div className="mb-16 flex items-start justify-between md:mb-20">
          <Logo width={140} />
          {/* Emblem placeholder — owner to provide secondary mon SVG.
              Reserves space so layout doesn't shift on delivery. */}
          <div
            aria-hidden
            className="hidden h-10 w-10 md:block"
            data-emblem-slot
          />
        </div>

        {/* 4-column link grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          {footer.columns.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-6 font-sans text-caption uppercase text-mist">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {(col.links as readonly FooterLink[]).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="font-sans text-[13px] leading-[1.4] text-paper transition-opacity duration-200 hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider + bottom legal row */}
        <div className="mt-20 border-t border-smoke pt-8 md:mt-24">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="font-sans text-[12px] uppercase tracking-[0.04em] text-steel">
              © {footer.copyrightYear} {footer.copyrightHolder}
            </p>
            <ul className="flex gap-8">
              {footer.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-sans text-[12px] uppercase tracking-[0.04em] text-steel transition-colors duration-200 hover:text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
