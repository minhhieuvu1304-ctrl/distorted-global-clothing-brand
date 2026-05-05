/**
 * Klaviyo back-in-stock subscription.
 *
 * Wraps `POST /back-in-stock-subscriptions/`. Adds a profile to the
 * back-in-stock notification flow for a specific catalog variant.
 *
 * Email-only by default — the PDP "Notify me when available" form
 * captures only an email (spec §5). If the form is ever expanded to
 * also capture phone, switch the channels array to ['EMAIL', 'SMS'].
 *
 * Owner action item (spec §15): the back-in-stock automation itself
 * — i.e. the email/flow that goes out when the restock event fires
 * — is configured Klaviyo-side (dashboard, not code). This endpoint
 * just registers the profile so they receive that flow's output.
 */

import { klaviyoFetch } from './client';
import type {
  BackInStockInput,
  BackInStockRequestBody,
  KlaviyoResult,
} from './types';

export async function triggerBackInStock(
  input: BackInStockInput
): Promise<KlaviyoResult<unknown>> {
  const body = buildBackInStockPayload(input);
  return klaviyoFetch<unknown>('/back-in-stock-subscriptions/', body);
}

export function buildBackInStockPayload(
  input: BackInStockInput
): BackInStockRequestBody {
  const channels = input.channels ?? ['EMAIL'];
  return {
    data: {
      type: 'back-in-stock-subscription',
      attributes: {
        channels,
        profile: {
          data: {
            type: 'profile',
            attributes: { email: input.email },
          },
        },
      },
      relationships: {
        variant: {
          data: {
            type: 'catalog-variant',
            id: input.variantId,
          },
        },
      },
    },
  };
}
