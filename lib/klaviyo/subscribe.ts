/**
 * Klaviyo subscription helper.
 *
 * Wraps `POST /profile-subscription-bulk-create-jobs/` to add a
 * profile to a list with explicit channel consent.
 *
 * Why this endpoint: it's the modern (2024+) Klaviyo path for
 * adding subscribers WITH consent. The older /v1 endpoints worked
 * but lack the consent fields TCPA/GDPR require for SMS.
 *
 * Email subscription is always SUBSCRIBED. SMS subscription is only
 * requested when `phone` is provided AND we set the consent flag
 * + consented_at timestamp — Klaviyo's documented requirement for
 * compliant SMS opt-in.
 */

import { klaviyoFetch } from './client';
import type {
  KlaviyoResult,
  SubscribeInput,
  SubscribeRequestBody,
} from './types';

/**
 * Add a profile to a Klaviyo list with email + optional SMS consent.
 *
 * The endpoint queues an async job and returns 202 Accepted with no
 * body — `data` will be `undefined` on success. That's expected.
 */
export async function subscribeToList(
  input: SubscribeInput
): Promise<KlaviyoResult<unknown>> {
  const body = buildSubscribePayload(input);
  return klaviyoFetch<unknown>('/profile-subscription-bulk-create-jobs/', body);
}

/**
 * Build the JSON:API payload Klaviyo expects.
 *
 * Exported separately so the test script can show owners the exact
 * shape that goes over the wire — useful for debugging during
 * Klaviyo account setup.
 */
export function buildSubscribePayload(
  input: SubscribeInput
): SubscribeRequestBody {
  const { email, phone, listId } = input;

  // Profile attributes — start with email-only, then layer SMS on
  // if a phone was provided.
  const profileAttributes: SubscribeRequestBody['data']['attributes']['profiles']['data'][number]['attributes'] =
    {
      email,
      subscriptions: {
        email: { marketing: { consent: 'SUBSCRIBED' } },
      },
    };

  if (phone && phone.trim().length > 0) {
    profileAttributes.phone_number = phone;
    profileAttributes.subscriptions.sms = {
      // SUBSCRIBED + consented_at is the documented compliant path.
      // The user agreed via the consent text rendered in the form
      // (see <EarlyAccessForm /> + Prompt 2 §3 locked copy).
      marketing: {
        consent: 'SUBSCRIBED',
        consented_at: new Date().toISOString(),
      },
      // Also opt into transactional (e.g. shipping notifications).
      // Owner can disable by removing this block — but the spec
      // bundles SMS into one capture flow, so we include it.
      transactional: { consent: 'SUBSCRIBED' },
    };
  }

  return {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: {
          data: [{ type: 'profile', attributes: profileAttributes }],
        },
      },
      relationships: {
        list: {
          data: { type: 'list', id: listId },
        },
      },
    },
  };
}
