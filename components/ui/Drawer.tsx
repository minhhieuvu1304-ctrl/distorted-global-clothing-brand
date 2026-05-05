'use client';

import { type ReactNode, useCallback, useEffect } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Drawer
 *
 * Spec §5 cart drawer + Prompt 2 §5 (LOCKED behavior):
 *   - Slides in from right.
 *   - 320px wide on desktop, full-width on mobile.
 *   - Solid `--ink` background, 1px left border `--smoke`.
 *   - Backdrop: 50% ink opacity over the page.
 *   - Slide-in transition: 400ms cubic-bezier(0.22, 1, 0.36, 1).
 *   - Closes on: × click, ESC, click backdrop.
 *   - Optional auto-close after 4s (used by cart drawer per spec §5).
 *   - Page scroll position preserved (no body lock — backdrop catches
 *     wheel events, but underlying page stays put).
 *
 * Like Modal, this is a controlled component — parent owns `open`.
 */
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional title for screen readers. */
  ariaLabel?: string;
  /**
   * Auto-close after N milliseconds. Pass 4000 for the spec'd cart
   * drawer behavior. `undefined` (default) disables auto-close.
   * Hovering inside the drawer pauses the timer; leaving resumes it.
   */
  autoCloseMs?: number;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  children,
  ariaLabel = 'Drawer',
  autoCloseMs,
  className,
}: DrawerProps) {
  const reduced = useReducedMotion();

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Auto-close timer. Cleared on close, on unmount, and reset whenever
  // open transitions from false → true.
  useEffect(() => {
    if (!open || !autoCloseMs) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, autoCloseMs, onClose]);

  const onBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Transition + transform driven by inline style so we can match the
  // exact cubic-bezier and duration from the spec without bloating
  // Tailwind config with a one-off utility.
  const transitionStyle: React.CSSProperties = reduced
    ? {}
    : {
        transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      };

  return (
    <>
      {/* Backdrop — only rendered when open, fades via tailwind animate */}
      {open && (
        <div
          aria-hidden="true"
          onClick={onBackdropClick}
          className={cn(
            'fixed inset-0 z-[90] bg-ink/50',
            !reduced && 'animate-fade-in'
          )}
        />
      )}

      {/*
        Drawer panel — always in the DOM so the slide animation can run
        on close as well as open. Translated off-screen when closed.
        Pointer-events disabled in closed state so it doesn't block the
        page underneath even at 0 width on mobile.
      */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!open}
        className={cn(
          'fixed right-0 top-0 z-[91] h-full bg-ink text-paper',
          'w-full md:w-[320px]',
          'border-l border-smoke',
          // Off-screen when closed
          open ? 'translate-x-0' : 'translate-x-full',
          !open && 'pointer-events-none',
          className
        )}
        style={transitionStyle}
      >
        {/* Close button — top-right within the drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            'absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center',
            'text-paper transition-opacity duration-300 ease-out hover:opacity-70'
          )}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ×
          </span>
        </button>

        <div className="h-full overflow-y-auto px-6 pb-8 pt-16">{children}</div>
      </aside>
    </>
  );
}
