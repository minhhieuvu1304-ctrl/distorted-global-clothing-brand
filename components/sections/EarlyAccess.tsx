import { siteConfig } from '@/config/site.config';
import { FadeIn } from '@/components/ui/FadeIn';
import { EarlyAccessForm } from '@/components/ui/EarlyAccessForm';

/**
 * Early Access
 *
 * Spec §4 Section 3 + Prompt 4 §3.
 *
 * Narrow centered column (~480px), Bodoni headline, sub-line,
 * email + (conditional) phone + consent — all delivered by the
 * <EarlyAccessForm /> primitive built in Prompt 2.
 *
 * The form already reads `siteConfig.features.smsCapture` and swaps
 * the phone field + consent text accordingly, so this section just
 * passes the config-driven `headline` and `sublabel` props through.
 *
 * Submission is stubbed to console — Prompt 8 wires Klaviyo.
 */
export function EarlyAccess() {
  const { headline, subline } = siteConfig.earlyAccess;

  return (
    <section
      aria-label="Early access"
      className="flex min-h-[80vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[480px] px-6 py-20 md:py-32">
        <FadeIn>
          <EarlyAccessForm headline={headline} sublabel={subline} />
        </FadeIn>
      </div>
    </section>
  );
}
