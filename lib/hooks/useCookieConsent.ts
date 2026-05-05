'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * useCookieConsent
 *
 * Single source of truth for cookie consent state. Reads and writes
 * localStorage; exposes a tri-state for the consumer:
 *
 *   hasConsented = null   — boot pending; SSR or first render before
 *                           localStorage is read. Consumers should
 *                           render NOTHING in this state to avoid
 *                           SSR/CSR hydration mismatch.
 *   hasConsented = false  — user has not consented (or consent expired)
 *   hasConsented = true   — user consented within the last 365 days
 *
 * Per spec §9 + Prompt 9 §1:
 *   - Consent is stored as { value: 'accepted', timestamp: <ms> }
 *   - Consent older than 365 days re-prompts (returns false).
 *   - revokeConsent clears the stored value.
 *
 * The 365-day freshness rule lives in this hook (not the component)
 * so any other consumer that wants to gate functionality on consent
 * automatically gets the right answer without re-implementing it.
 */

const STORAGE_KEY = 'distorted:cookieConsent';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  value: 'accepted';
  /** Unix ms timestamp of when consent was given. */
  timestamp: number;
}

interface CookieConsentApi {
  /** null while booting; boolean once localStorage has been read. */
  hasConsented: boolean | null;
  giveConsent: () => void;
  revokeConsent: () => void;
}

export function useCookieConsent(): CookieConsentApi {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  // Read localStorage on mount. Wrapped in try/catch because
  // localStorage can throw under privacy modes / disabled storage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHasConsented(false);
        return;
      }
      const parsed = JSON.parse(raw) as StoredConsent;
      const fresh =
        parsed.value === 'accepted' &&
        typeof parsed.timestamp === 'number' &&
        Date.now() - parsed.timestamp < ONE_YEAR_MS;
      setHasConsented(fresh);
    } catch {
      // Storage unavailable or value malformed — behave as if no consent.
      setHasConsented(false);
    }
  }, []);

  const giveConsent = useCallback(() => {
    try {
      const stored: StoredConsent = {
        value: 'accepted',
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable — proceed anyway; the banner won't reappear
      // this session but will return on the next page load.
    }
    setHasConsented(true);
  }, []);

  const revokeConsent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setHasConsented(false);
  }, []);

  return { hasConsented, giveConsent, revokeConsent };
}
