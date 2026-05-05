import { siteConfig } from '@/config/site.config';
import { FadeIn } from '@/components/ui/FadeIn';

/**
 * Brand Statement
 *
 * Spec §4 Section 2 + Prompt 4 §2.
 *
 * The editorial pause between the hero's noise and the Early Access
 * conversion ask. ~80vh, full-bleed, single Bodoni line, generous
 * margin around it.
 *
 * Notable detail: the copy here ends with a period
 *   ("An experience far beyond fabrics.")
 * while the hero subhead does not
 *   ("An experience far beyond fabrics")
 * — same words, different punctuation. The hero is a tagline; the
 * brand statement is a sentence. Both are config-editable.
 *
 * Background mode: solid `--ink` for v1. The `style` field on the
 * config block leaves room for a future "image with overlay" mode
 * (spec §4 Section 2: "solid `--ink` OR full-bleed editorial image
 * with dark overlay (final choice during build)").
 */
export function BrandStatement() {
  const { copy } = siteConfig.brandStatement;

  return (
    <section
      aria-label="Brand statement"
      className="flex min-h-[80vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 py-20 md:px-12 md:py-32 lg:px-16">
        <FadeIn>
          {/*
            Left-aligned with generous left margin on desktop — feels
            more editorial than dead-centered, matches reference brands
            (Fear of God, A-COLD-WALL*) per spec §1. Mobile drops the
            indent so the line breathes within tighter gutters.
          */}
          <p className="font-display text-paper md:max-w-[80%] md:pl-[8%] lg:pl-[12%]">
            <span className="block text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] lg:text-[64px]">
              {copy}
            </span>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
