'use client';

import {
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Lightbox
 *
 * Spec §6 (LOCKED) + Prompt 2 §6:
 *   - Fullscreen, near-black backdrop (#0A0A0A) 90%+ opacity.
 *   - Image scales to fit viewport with ~5% padding.
 *   - Open animation: 400ms scale-up from a starting bounding rect,
 *     ease-out. The originRect comes from the element that was
 *     clicked (typically getBoundingClientRect of the lookbook image).
 *   - Close: × / click outside / ESC.
 *   - Navigate: ← → keyboard, swipe on mobile (custom touch handlers
 *     to avoid pulling in react-swipeable for one use).
 *   - No metadata — pure image, per spec ("no captions, names, shop links").
 *   - Loads higher-res variant (`imageHighRes`) when triggered;
 *     in-page version is ~1400px, lightbox is ~2400px.
 *
 * Reduced motion: skips the scale-up animation; image just fades in.
 */

export interface LightboxImage {
  /** Source for in-page (~1400px). Used as fallback if highRes missing. */
  src: string;
  /** Higher-res source (~2400px) loaded on open. */
  srcHighRes?: string;
  alt: string;
  /** Intrinsic dimensions for next/image. */
  width: number;
  height: number;
}

interface LightboxProps {
  /** Open state — controlled by parent. */
  open: boolean;
  /** Array of images to navigate through. */
  images: LightboxImage[];
  /** Currently displayed index. */
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  /**
   * Bounding rect of the element that triggered open. Used as the
   * origin of the scale-up animation. If omitted, lightbox simply
   * fades in.
   */
  originRect?: DOMRect | null;
}

export function Lightbox({
  open,
  images,
  index,
  onClose,
  onIndexChange,
  originRect,
}: LightboxProps) {
  const reduced = useReducedMotion();
  const [animateIn, setAnimateIn] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const current = images[index];

  const goPrev = useCallback(() => {
    if (images.length < 2) return;
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (images.length < 2) return;
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  // Keyboard navigation — ESC close, ←/→ navigate.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Trigger the scale-up animation on open by toggling state on the
  // next animation frame (so the initial transform applies before the
  // transition kicks in).
  useEffect(() => {
    if (!open) {
      setAnimateIn(false);
      return;
    }
    if (reduced) {
      setAnimateIn(true);
      return;
    }
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [open, reduced]);

  // Touch handlers for swipe nav. Threshold: 50px horizontal travel
  // exceeding the vertical travel by 1.5x — feels natural and avoids
  // accidentally triggering on vertical scroll attempts.
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open || !current) return null;

  // Compute initial transform from origin rect for the scale-up
  // animation. Default state (animateIn=true) renders at center,
  // full size; initial (animateIn=false) shrinks to the origin rect.
  let originStyle: React.CSSProperties = {};
  if (originRect && !reduced) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
    const cx = originRect.left + originRect.width / 2;
    const cy = originRect.top + originRect.height / 2;
    const tx = cx - vw / 2;
    const ty = cy - vh / 2;
    const sx = originRect.width / vw;
    const sy = originRect.height / vh;
    const scale = Math.max(sx, sy);
    if (!animateIn) {
      originStyle = {
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        opacity: 0,
      };
    }
  } else if (!animateIn) {
    originStyle = { opacity: 0 };
  }

  // Use the high-res source if provided, fall back to in-page.
  const displaySrc = current.srcHighRes ?? current.src;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onBackdropClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[110] flex items-center justify-center"
      // Near-black 90% backdrop per spec — slightly darker than ink.
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.92)' }}
    >
      {/* Close button — top-right */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center text-paper transition-opacity duration-300 ease-out hover:opacity-70"
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          ×
        </span>
      </button>

      {/* Prev / Next buttons — desktop only; mobile uses swipe */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-paper transition-opacity duration-300 ease-out hover:opacity-70 md:flex"
          >
            <span aria-hidden="true" className="text-2xl">
              ←
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-paper transition-opacity duration-300 ease-out hover:opacity-70 md:flex"
          >
            <span aria-hidden="true" className="text-2xl">
              →
            </span>
          </button>
        </>
      )}

      {/* Image — fits viewport with 5% padding per spec */}
      <div
        className={cn(
          'relative flex h-[90vh] w-[90vw] items-center justify-center'
        )}
        style={{
          transition: reduced
            ? 'opacity 200ms ease-out'
            : 'transform 400ms ease-out, opacity 400ms ease-out',
          transformOrigin: 'center center',
          ...originStyle,
        }}
      >
        <Image
          key={displaySrc}
          src={displaySrc}
          alt={current.alt}
          width={current.width}
          height={current.height}
          className="h-full w-full object-contain"
          priority
        />
      </div>
    </div>
  );
}
