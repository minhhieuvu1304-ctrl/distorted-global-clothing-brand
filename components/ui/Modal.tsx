'use client';

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Modal
 *
 * Spec §5 PDP modal + Prompt 2 §4 (LOCKED behavior):
 *   - Full-screen overlay, ink backdrop at 90% opacity.
 *   - Slide-in from below, 300ms ease-out.
 *   - Close on: × click, ESC key, click outside content area.
 *   - Body scroll locked while open.
 *   - URL state managed separately via useModalRoute() (below).
 *
 * Reduced motion: skips the slide animation, content appears at rest.
 *
 * The component is "controlled" — parent owns `open` state and the
 * `onClose` handler. For query-param-driven modals, parents typically
 * derive `open` from useModalRoute() and pass close() as the handler.
 *
 * Content lives in a centered container; the surrounding area is the
 * click-outside target. The container itself has `bg-ink` so it reads
 * as a solid surface against the 90%-opacity backdrop.
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the dialog. */
  ariaLabel?: string;
  /** Optional max-width override for the inner container. */
  maxWidth?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  ariaLabel = 'Dialog',
  maxWidth = 'max-w-[1200px]',
  className,
}: ModalProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock while open. Restores previous overflow on close
  // (so we don't trample some other modal's lock).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the dialog on open (basic focus management).
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only fire onClose when the click target is the backdrop itself,
      // not bubbled from inner content.
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      ref={dialogRef}
      tabIndex={-1}
      onClick={onBackdropClick}
      className={cn(
        // Full-screen, fixed, ink 90% backdrop
        'fixed inset-0 z-[100] bg-ink/90',
        // Center content
        'flex items-end justify-center md:items-center',
        // Backdrop fades in
        !reduced && 'animate-fade-in',
        className
      )}
    >
      {/* Content container — slides up from below per spec */}
      <div
        className={cn(
          'relative w-full bg-ink',
          maxWidth,
          // Mobile: full-height sheet from bottom; desktop: centered card
          'h-full md:h-auto md:max-h-[90vh] md:rounded-sm',
          'overflow-y-auto'
        )}
        style={
          reduced
            ? undefined
            : {
                animation: 'slide-up 300ms ease-out forwards',
              }
        }
      >
        {/* Close button — top-right, always reachable */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            'absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center',
            'text-paper transition-opacity duration-300 ease-out hover:opacity-70',
            'md:right-6 md:top-6'
          )}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ×
          </span>
        </button>
        {children}
      </div>

      {/*
        Inline keyframes for the slide — defined here rather than
        globals.css because the modal owns this animation. The 'fade-in'
        keyframe is already in globals/Tailwind config.
      */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * useModalRoute
 *
 * Manages modal open/close state via a URL query param so modals can
 * be deep-linked, refreshed, and shared. Spec §5: PDP modals use
 * `/shop?product=hoodie-no-03`.
 *
 * Usage:
 *   const { value, open, close } = useModalRoute('product');
 *   const isOpen = value !== null;
 *   <Modal open={isOpen} onClose={close}>...</Modal>
 *
 *   // To open: open('hoodie-no-03')
 *   // To close: close()
 *
 * Uses Next App Router's `useRouter` + `useSearchParams`. `replace`
 * is used (not `push`) so opening/closing the modal doesn't pollute
 * the back-button history with intermediate states; the user expects
 * "back" to leave the page, not just close the modal. ESC/× close
 * are handled via onClose anyway.
 */
export function useModalRoute(paramName: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(paramName);

  const buildUrl = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === null) {
        params.delete(paramName);
      } else {
        params.set(paramName, next);
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams, paramName]
  );

  const open = useCallback(
    (val: string) => {
      router.replace(buildUrl(val), { scroll: false });
    },
    [router, buildUrl]
  );

  const close = useCallback(() => {
    router.replace(buildUrl(null), { scroll: false });
  }, [router, buildUrl]);

  return { value, open, close };
}
