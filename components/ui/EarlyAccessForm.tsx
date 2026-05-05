'use client';

import { useState, type FormEvent } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks';

/**
 * EarlyAccessForm
 *
 * Spec §4 Section 3, §8 Contact, Prompt 2 §3.
 *
 * The Early Access signup. Used on the landing page (with headline)
 * and on the Contact page (without headline — the page header carries it).
 *
 * Behavior:
 *   - Email always required.
 *   - Phone field renders only when `siteConfig.features.smsCapture` is true.
 *     Includes a country code selector (default +1) to its left.
 *   - Submit is a small arrow → button to the right of the email row.
 *   - Consent disclosure text auto-swaps based on the SMS flag, using
 *     the locked copy from Prompt 2 §3 (slight wording difference vs.
 *     siteConfig.earlyAccess.consent — Prompt 2 wording overrides here
 *     since this is the more recent locked source).
 *   - Inline error messages appear under the relevant field.
 *   - Success state replaces the form with a Bodoni "You're on the list."
 *     fade-in.
 *   - Submission posts to /api/klaviyo/subscribe (Prompt 8). Errors
 *     map to friendly user-facing copy; success state replaces the
 *     form with a Bodoni "You're on the list."
 *
 * Headline + sublabel are optional props so the same component renders
 * on both the landing page (with title) and the contact page (where
 * the page header serves as the title).
 */

interface EarlyAccessFormProps {
  /** Optional Bodoni headline above the form. Pass to display, omit to hide. */
  headline?: string;
  /** Optional Inter sub-line under the headline. */
  sublabel?: string;
  /** Layout mode: 'inline' shows email + arrow on one line (default).
   *  'stacked' is for narrow contexts. */
  layout?: 'inline' | 'stacked';
  /** Extra wrapper classes. */
  className?: string;
}

// Country code options — pragmatic short list of brand's likely markets.
// Owner can expand by editing this array; codes are E.164 dialing prefixes.
const COUNTRY_CODES = [
  { code: '+1', label: '+1', region: 'US/CA' },
  { code: '+44', label: '+44', region: 'UK' },
  { code: '+61', label: '+61', region: 'AU' },
  { code: '+81', label: '+81', region: 'JP' },
  { code: '+82', label: '+82', region: 'KR' },
  { code: '+86', label: '+86', region: 'CN' },
  { code: '+852', label: '+852', region: 'HK' },
  { code: '+33', label: '+33', region: 'FR' },
  { code: '+49', label: '+49', region: 'DE' },
] as const;

// Locked consent copy from Prompt 2 §3 — supersedes the placeholder
// in siteConfig.earlyAccess.consent (which was Prompt 1 boilerplate).
const CONSENT_COPY = {
  withSms:
    'By submitting, you agree to receive emails and texts from Distorted. Reply STOP to unsubscribe.',
  emailOnly:
    'By submitting, you agree to receive emails from Distorted. Unsubscribe anytime.',
};

// Lightweight email regex — server validation is the real authority.
// Avoids the full RFC monstrosity; catches common typos at the edge.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone — at least 7 digits after stripping non-numerics. Country
// code is held separately, so this validates the local part only.
const PHONE_DIGIT_RE = /\d/g;

export function EarlyAccessForm({
  headline,
  sublabel,
  layout = 'inline',
  className,
}: EarlyAccessFormProps) {
  const reduced = useReducedMotion();
  const smsEnabled = siteConfig.features.smsCapture;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  /**
   * Form-level error not attached to a specific field — used for
   * network failures, rate-limiting, and Klaviyo unavailability.
   * Field validation issues use emailError / phoneError instead.
   */
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    let ok = true;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email.');
      ok = false;
    } else {
      setEmailError(null);
    }
    if (smsEnabled && phone.trim().length > 0) {
      const digits = phone.match(PHONE_DIGIT_RE)?.length ?? 0;
      if (digits < 7) {
        setPhoneError('Enter a valid phone number.');
        ok = false;
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
    return ok;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);

    // Build the payload that matches /api/klaviyo/subscribe's
    // ParsedSubscribeBody. SMS only included when (a) the feature is
    // on, (b) the user actually entered a phone number. Country code
    // is concatenated with stripped digits to produce E.164.
    const payload: { email: string; phone?: string } = {
      email: email.trim(),
    };
    if (smsEnabled && phone.trim()) {
      payload.phone = `${countryCode}${phone.replace(/[^\d]/g, '')}`;
    }

    let response: Response;
    try {
      response = await fetch('/api/klaviyo/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Network unreachable (offline, DNS, etc.). Spec §10 (Prompt 8):
      // "Service temporarily unavailable" is the locked friendly copy.
      setSubmitting(false);
      setFormError('Service temporarily unavailable. Please try again later.');
      return;
    }

    let json: { ok?: boolean; error?: string } = {};
    try {
      json = (await response.json()) as typeof json;
    } catch {
      // Server returned non-JSON — treat as generic failure.
    }
    setSubmitting(false);

    // Server returned ok or an "already subscribed" 200 — both surface
    // as the same success state per Prompt 8 §3 (the user message in
    // the duplicate case differs slightly so they know they're already
    // on the list, but the visual state is the same Bodoni success).
    if (json.ok) {
      setSubmitted(true);
      return;
    }

    // Map error codes to user-facing copy. Field-specific errors
    // attach to the field; non-field errors go to formError.
    switch (json.error) {
      case 'invalid-email':
        setEmailError('Enter a valid email.');
        break;
      case 'invalid-phone':
        setPhoneError('Enter a valid phone number.');
        break;
      case 'duplicate':
        // Edge case — usually returned as ok:true on a 200, but if
        // Klaviyo classifies it differently we still treat it as
        // "you're already on the list" rather than an error.
        setSubmitted(true);
        break;
      case 'rate-limited':
        setFormError('Too many requests. Please wait a moment and try again.');
        break;
      case 'unconfigured':
      case 'unavailable':
        setFormError(
          'Service temporarily unavailable. Please try again later.'
        );
        break;
      default:
        setFormError('Something went wrong. Please try again.');
    }
  }

  // Success state — Bodoni "You're on the list." with fade-in.
  if (submitted) {
    return (
      <div
        className={cn('w-full', className)}
        role="status"
        aria-live="polite"
        style={
          reduced
            ? undefined
            : {
                animation: 'fade-in 600ms ease-out forwards',
              }
        }
      >
        {headline && (
          <h2 className="mb-3 font-display text-display-m uppercase md:text-display-l">
            {headline}
          </h2>
        )}
        <p className="font-display text-display-m text-paper md:text-display-l">
          You&rsquo;re on the list.
        </p>
      </div>
    );
  }

  const consentText = smsEnabled
    ? CONSENT_COPY.withSms
    : CONSENT_COPY.emailOnly;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn('w-full max-w-[480px]', className)}
    >
      {headline && (
        <h2 className="mb-3 font-display text-display-m uppercase md:text-display-l">
          {headline}
        </h2>
      )}
      {sublabel && (
        <p className="mb-8 font-sans text-[14px] text-mist md:mb-10">
          {sublabel}
        </p>
      )}

      {/* Email row — input + arrow submit, side by side at inline layout */}
      <div
        className={cn(
          layout === 'inline' ? 'flex items-end gap-3' : 'flex flex-col gap-3'
        )}
      >
        <Input
          variant="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={siteConfig.earlyAccess.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          aria-label="Email address"
          required
        />
        {/*
          When the phone field is present, the email-row submit button
          would be premature. We render the submit at the bottom in
          that case (see below). For email-only mode, the inline arrow
          submit matches the spec mock more cleanly.
        */}
        {!smsEnabled && (
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            arrow
            loading={submitting}
            aria-label="Submit"
            className="shrink-0"
          >
            <span className="sr-only">Submit</span>
          </Button>
        )}
      </div>

      {/* Phone row — only when SMS feature flag is on */}
      {smsEnabled && (
        <div className="mt-6 flex items-end gap-3">
          {/* Country code selector — styled to match the input underline */}
          <div className="shrink-0">
            <label
              htmlFor="ea-country"
              className="mb-2 block font-sans text-caption uppercase text-mist"
            >
              Code
            </label>
            <select
              id="ea-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={cn(
                'w-[88px] bg-transparent font-sans text-body text-paper',
                'border-0 border-b border-solid border-steel',
                'transition-colors duration-300 ease-out',
                'focus:border-paper focus:outline-none focus:ring-0',
                'py-3'
              )}
              aria-label="Country dialing code"
            >
              {COUNTRY_CODES.map((c) => (
                <option
                  key={c.code}
                  value={c.code}
                  className="bg-ink text-paper"
                >
                  {c.label} {c.region}
                </option>
              ))}
            </select>
          </div>
          <Input
            variant="tel"
            name="phone"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder={siteConfig.earlyAccess.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneError}
            aria-label="Phone number"
          />
        </div>
      )}

      {/* When SMS is on, the submit button moves to its own row below */}
      {smsEnabled && (
        <div className="mt-8">
          <Button type="submit" variant="ghost" arrow loading={submitting}>
            Submit
          </Button>
        </div>
      )}

      {/* Form-level error — network, rate limit, or unavailable.
          Field validation errors render under the relevant field above. */}
      {formError && (
        <p className="mt-4 font-sans text-caption text-alert" role="alert">
          {formError}
        </p>
      )}

      {/*
        Consent disclosure (TCPA / GDPR per Prompt 8 §5).
        Includes a Privacy link the form's submission action implicitly
        agrees to. The /privacy route is placeholder content until the
        owner provides legal copy (spec §15 outstanding).
      */}
      <p className="mt-6 font-sans text-caption normal-case tracking-normal text-steel">
        {consentText}{' '}
        <a
          href="/privacy"
          className="underline underline-offset-[3px] hover:text-mist"
        >
          Privacy
        </a>
        .
      </p>
    </form>
  );
}
