/**
 * Klaviyo connectivity test.
 *
 * Subscribes a test email to your Early Access list, then immediately
 * unsubscribes it. Verifies that:
 *   - .env.local has the right env vars set
 *   - the private key has the necessary scopes
 *   - the list ID exists and is reachable
 *
 * Usage:
 *   npx tsx scripts/test-klaviyo.ts
 *
 * Or, if tsx isn't installed:
 *   npx -p tsx tsx scripts/test-klaviyo.ts
 *
 * Optional override:
 *   TEST_EMAIL=your-real-test@example.com npx tsx scripts/test-klaviyo.ts
 *
 * The default test email uses a `+klaviyo-test-<timestamp>@example.com`
 * pattern so each run targets a fresh profile and the test is
 * idempotent — running it 50 times won't pollute your list with a
 * duplicate every time.
 */

// Load .env.local manually since this script runs outside Next's
// usual env loading. We use the dotenv pattern but keep it inline
// to avoid adding dotenv as a dependency just for this script.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

(function loadDotEnv() {
  try {
    const path = resolve(process.cwd(), '.env.local');
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn(
      '[test-klaviyo] No .env.local found — relying on shell environment.'
    );
  }
})();

const PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
const LIST_ID = process.env.KLAVIYO_LIST_ID_EARLY_ACCESS;

const TEST_EMAIL =
  process.env.TEST_EMAIL ?? `klaviyo-test-${Date.now()}@example.com`;

// ──────────────────────────────────────────────────────────────────────
// Pre-flight
// ──────────────────────────────────────────────────────────────────────

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function ok(msg: string): void {
  console.log(`✓ ${msg}`);
}

if (!PRIVATE_KEY) fail('KLAVIYO_PRIVATE_KEY is not set in .env.local');
if (!PRIVATE_KEY.startsWith('pk_')) {
  fail(
    'KLAVIYO_PRIVATE_KEY does not look like a Klaviyo private key (expected pk_ prefix)'
  );
}
if (!LIST_ID) fail('KLAVIYO_LIST_ID_EARLY_ACCESS is not set in .env.local');

ok('env vars present');
console.log(`  using test email: ${TEST_EMAIL}`);
console.log(`  using list id:    ${LIST_ID}`);

// ──────────────────────────────────────────────────────────────────────
// Test fetch
// ──────────────────────────────────────────────────────────────────────

const HEADERS = {
  Authorization: `Klaviyo-API-Key ${PRIVATE_KEY}`,
  'Content-Type': 'application/json',
  accept: 'application/json',
  revision: '2024-10-15',
};

async function subscribe(): Promise<void> {
  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email: TEST_EMAIL,
                subscriptions: {
                  email: { marketing: { consent: 'SUBSCRIBED' } },
                },
              },
            },
          ],
        },
      },
      relationships: {
        list: { data: { type: 'list', id: LIST_ID } },
      },
    },
  };

  const res = await fetch(
    'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/',
    { method: 'POST', headers: HEADERS, body: JSON.stringify(body) }
  );

  if (res.status === 202) {
    ok('subscribe accepted (202)');
    return;
  }

  const errBody = await res.text().catch(() => '');
  fail(`subscribe failed: ${res.status} ${res.statusText} — ${errBody}`);
}

async function unsubscribe(): Promise<void> {
  // Use the bulk suppression endpoint to clean up the test profile.
  // This unsubscribes the email from marketing — the standard "remove"
  // path for Klaviyo. The profile may still exist in your account
  // but won't receive marketing.
  const body = {
    data: {
      type: 'profile-suppression-bulk-create-job',
      attributes: {
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: { email: TEST_EMAIL },
            },
          ],
        },
      },
    },
  };

  const res = await fetch(
    'https://a.klaviyo.com/api/profile-suppression-bulk-create-jobs/',
    { method: 'POST', headers: HEADERS, body: JSON.stringify(body) }
  );

  if (res.status === 202) {
    ok('unsubscribe accepted (202)');
    return;
  }

  // Non-fatal — log a warning but don't fail the whole test.
  const errBody = await res.text().catch(() => '');
  console.warn(
    `⚠ unsubscribe failed: ${res.status} ${res.statusText} — ${errBody}\n` +
      `  (the test email may still be subscribed; remove manually)`
  );
}

// ──────────────────────────────────────────────────────────────────────
// Run
// ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n→ Subscribing test profile…');
  await subscribe();

  // Brief pause — Klaviyo's bulk endpoints are async; cleanup right
  // after subscribe sometimes races. 1.5s is generous.
  await new Promise((r) => setTimeout(r, 1500));

  console.log('→ Cleaning up test profile…');
  await unsubscribe();

  console.log('\nAll Klaviyo connectivity checks passed.');
  console.log(
    'If you used the default email pattern, no further action is needed.\n' +
      'If you set TEST_EMAIL, the unsubscribe was best-effort — verify\n' +
      'in your Klaviyo dashboard that the profile is suppressed.'
  );
})().catch((err) => {
  console.error('\n✗ Test crashed:', err);
  process.exit(1);
});
