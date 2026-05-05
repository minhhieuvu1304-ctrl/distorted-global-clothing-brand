import type { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { EarlyAccessForm } from '@/components/ui/EarlyAccessForm';
import { FadeIn } from '@/components/ui/FadeIn';
import { cn } from '@/lib/cn';

/**
 * /contact — three-section page (spec §8 + Prompt 7).
 *
 *   1. Header           — Bodoni "GET EARLY ACCESS"
 *   2. Signup form      — reuses <EarlyAccessForm /> from Prompt 2
 *   3. General inquiries — single mailto: email link
 *
 * Composition is inlined here rather than split into three section
 * components — each block is short and only used on this page, so a
 * single file keeps the flow legible without manufacturing indirection.
 *
 * Footer is rendered globally in app/layout.tsx.
 *
 * The page is a server component — no client-side data fetching, no
 * interactive state at the page level. The form component itself is
 * 'use client' (handles SMS toggle, validation, success state) but
 * sits inside this server tree.
 */

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get early access to Distorted drops. For all inquiries: ${siteConfig.contact.email}`,
};

export default function ContactPage() {
  return (
    <>
      <ContactHeader />
      <ContactSignupSection />
      <ContactInquiriesSection />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 1. Header — ~30vh, Bodoni headline, left-aligned
// ──────────────────────────────────────────────────────────────────────

function ContactHeader() {
  return (
    <header
      aria-label="Contact"
      // pt-24 / md:pt-32 reserves space for the fixed nav (h-16 mobile,
      // h-20 desktop) since this page has no full-bleed hero to sit
      // beneath the transparent nav.
      className="flex min-h-[30vh] items-end bg-ink pt-24 md:pt-32"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-6 md:pb-16">
        <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-[-0.01em] text-paper md:text-[64px] lg:text-[72px]">
          {siteConfig.contact.headline}
        </h1>
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 2. Signup form — ~50vh, narrow column, reuses EarlyAccessForm
// ──────────────────────────────────────────────────────────────────────

function ContactSignupSection() {
  return (
    <section
      aria-label="Sign up for early access"
      className="flex min-h-[50vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[480px] px-6 py-16 md:py-24">
        <FadeIn>
          {/*
            headline omitted — the page <h1> above already announces
            "GET EARLY ACCESS"; rendering it again here would duplicate.
            sublabel passes the locked sub-line per Prompt 7.
            All other behavior (email + conditional phone, consent text
            switching on the SMS flag, success state) is handled inside
            <EarlyAccessForm /> from Prompt 2 — identical to the
            homepage Early Access section.
          */}
          <EarlyAccessForm sublabel={siteConfig.contact.formSublabel} />
        </FadeIn>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 3. Inquiries — ~40vh, single mailto: link
// ──────────────────────────────────────────────────────────────────────

function ContactInquiriesSection() {
  const { inquiriesLabel, email, emailDescription } = siteConfig.contact;

  return (
    <section
      aria-label="General inquiries"
      className="flex min-h-[40vh] items-center bg-ink"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 md:px-6 md:py-24">
        <FadeIn>
          <div className="flex flex-col gap-6">
            <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-steel">
              {inquiriesLabel}
            </p>
            {/*
              Email is the focal point of this section — Bodoni, large,
              tappable. Mobile sizing stays at 24-28px so the touch
              target remains generous. Hover reveals a 1px underline at
              4px offset; rest state is clean.
            */}
            <a
              href={`mailto:${email}`}
              className={cn(
                'self-start font-display text-paper',
                'text-[24px] leading-tight md:text-[32px] lg:text-[40px]',
                'underline-offset-[4px] transition-all duration-300 ease-out',
                'hover:underline'
              )}
            >
              {email}
            </a>
            {emailDescription && (
              <p className="font-sans text-[13px] text-mist">
                {emailDescription}
              </p>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
