import type { Metadata } from 'next';
import { LookbookClient } from '@/components/sections/lookbook/LookbookClient';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Lookbook ${siteConfig.lookbook.coverLabel}`,
  description: `${siteConfig.lookbook.coverLabel} editorial — Distorted lookbook.`,
};

/**
 * /lookbook — editorial long-scroll page.
 *
 * Spec §6 + Prompt 6 §7. The page itself is intentionally thin —
 * the lookbook is an ordered list of layout modules driven entirely
 * by /config/lookbook.config.ts, and that traversal happens in the
 * client component (which also owns the page-level lightbox state).
 *
 * Why the whole thing is rendered through a 'use client' coordinator
 * rather than mixing server and client modules: the lightbox needs a
 * single coordinated state with global image indices spanning ALL
 * sections (Prompt 6 §7 — keyboard ←/→ cycles through every image,
 * not just within one module). Splitting that across server/client
 * boundaries would require passing the flat image array via props
 * and duplicating the index math. Keeping the whole thing client is
 * cleaner and the lookbook is intentionally above-the-fold for
 * engagement (not a perf-critical SEO surface like the shop).
 *
 * The Footer is rendered globally in the root layout.
 */
export default function LookbookPage() {
  return <LookbookClient />;
}
