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
      // min-h reduced from 80vh → 60vh per design review (Nov 2026).
      // 80vh dominated the scroll and created too much air around
      // adjacent sections (especially the gap into Early Access).
      // 60vh still gives the line editorial breathing room without
      // forcing the visitor to scroll past empty space.
      className="flex min-h-[60vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 py-20 md:px-12 md:py-32 lg:px-16">
        <FadeIn>
          {/*
            Left-aligned with generous left margin on desktop — feels
            more editorial than dead-centered, matches reference brands
            (Fear of God, A-COLD-WALL*) per spec §1. Mobile drops the
            indent so the line breathes within tighter gutters.

            Width: previously max-w-[80%], which forced "An experience
            far beyond fabrics." to wrap onto a second line at desktop
            (font-size 56-64px × 33-char line ≈ 1200px, exceeded the
            container at typical viewports). Widened to 95% so the line
            fits naturally. Left indent preserved for editorial feel.
          */}
          <p className="font-serif text-paper md:max-w-[90%] md:pl-[6%] lg:max-w-[95%] lg:pl-[10%]">
            <span className="block text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] lg:text-[64px]">
              {copy}
            </span>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
