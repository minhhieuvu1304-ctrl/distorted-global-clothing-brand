import type { Metadata } from 'next';

/**
 * /privacy — placeholder page.
 *
 * Spec §15 lists Privacy/Terms/Shipping/Returns as owner-supplied
 * legal content. This page exists so the link from the cookie banner
 * (and any other privacy reference) doesn't 404 before launch.
 *
 * Per Prompt 9 §3, this includes a STRUCTURAL "Cookies We Use" section
 * — actual legal language must be replaced by counsel before launch.
 *
 * Replace this entire file's content with the owner-provided privacy
 * policy when received.
 */

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy policy and cookie disclosure for Distorted.',
};

export default function PrivacyPage() {
  return (
    <main className="bg-ink pt-24 md:pt-32">
      <div className="mx-auto max-w-[800px] px-6 pb-32 md:px-8">
        {/* Header */}
        <header className="mb-16 md:mb-24">
          <h1 className="font-display text-[40px] uppercase leading-[1.05] tracking-[-0.01em] text-paper md:text-[64px]">
            Privacy
          </h1>
          <p className="mt-6 font-sans text-caption uppercase text-steel">
            Placeholder — final language pending.
          </p>
        </header>

        <div className="space-y-16">
          <Section heading="Overview">
            <p>
              This is placeholder text. The final privacy policy language will
              be provided by counsel before launch.
            </p>
          </Section>

          <Section heading="Information We Collect">
            <p>
              When you sign up for Early Access, we collect the email address
              (and phone number, if you opt in to SMS) you submit through our
              forms. When you make a purchase, the order information is
              processed by Shopify under their privacy policy.
            </p>
          </Section>

          <Section heading="Cookies We Use">
            {/*
              Structural list per Prompt 9 §3. Each row describes a
              category, not specific cookies, so the wording is durable
              even as third-party providers update their cookie names.
            */}
            <p>
              The site uses minimal cookies and browser storage. The categories
              are:
            </p>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="font-sans text-caption uppercase text-mist">
                  Necessary — Shopify
                </dt>
                <dd className="mt-2 font-sans text-[14px] leading-relaxed text-mist">
                  A cart identifier is stored locally so your cart persists
                  across page reloads. Required for the shopping experience. Not
                  used for tracking.
                </dd>
              </div>
              <div>
                <dt className="font-sans text-caption uppercase text-mist">
                  Marketing — Klaviyo
                </dt>
                <dd className="mt-2 font-sans text-[14px] leading-relaxed text-mist">
                  Klaviyo only receives your information after you explicitly
                  submit one of our forms (Early Access signup or back-in-stock
                  notification). No Klaviyo cookies are set on your device by us
                  before that consent.
                </dd>
              </div>
              <div>
                <dt className="font-sans text-caption uppercase text-mist">
                  Third-party — YouTube
                </dt>
                <dd className="mt-2 font-sans text-[14px] leading-relaxed text-mist">
                  Our homepage hero loads a YouTube embed for the background
                  video. YouTube may set its own cookies for video session and
                  analytics under Google&rsquo;s privacy policy. We do not
                  control these cookies.
                </dd>
              </div>
            </dl>
          </Section>

          <Section heading="How We Use Information">
            <p>
              Email and SMS subscribers receive marketing communications about
              new drops, restocks, and updates. You can unsubscribe at any time
              from any email or by replying STOP to any SMS.
            </p>
          </Section>

          <Section heading="Contact">
            <p>
              For privacy inquiries:{' '}
              <a
                href="mailto:info@distorted.global"
                className="text-paper underline underline-offset-[3px] hover:opacity-80"
              >
                info@distorted.global
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Local section helper — Bodoni heading + Inter body text
// ──────────────────────────────────────────────────────────────────────

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-[24px] leading-tight text-paper md:text-[28px]">
        {heading}
      </h2>
      <div className="font-sans text-[14px] leading-relaxed text-mist md:text-[15px]">
        {children}
      </div>
    </section>
  );
}
