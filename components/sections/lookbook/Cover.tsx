'use client';

import { useEffect, useState } from 'react';
import { LookbookImageBox } from './LookbookImageBox';
import type { CoverSection } from '@/lib/types';
import { useReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Cover
 *
 * Spec §6 + Prompt 6 §4. First section of the lookbook — full-bleed
 * 100vh image with a Bodoni title overlay and a scroll cue. 600ms
 * fade-in on page load, sequenced behind the image itself so the
 * title doesn't pop in before the image is ready.
 *
 * The cover is the only lookbook image marked `priority` for eager
 * loading — every other lookbook image lazy-loads (spec §6 perf
 * budget: only the cover should load immediately on initial paint).
 *
 * Click on the cover image opens the page-level lightbox at index 0
 * (cover is always the first lookbook image in the flat array).
 */
interface CoverProps {
  section: CoverSection;
  /** Click handler — page wires this to its lightbox state. */
  onImageClick: (originRect: DOMRect) => void;
}

export function Cover({ section, onImageClick }: CoverProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const titleAlignment =
    (section.titlePosition ?? 'bottom-left') === 'center-bottom'
      ? 'items-center text-center'
      : 'items-start text-left';

  return (
    <section
      aria-label="Lookbook cover"
      className="relative h-screen w-full overflow-hidden bg-shadow"
    >
      {/* Cover image — fills the section, click opens lightbox at 0 */}
      <div className="absolute inset-0">
        <LookbookImageBox
          image={section.image}
          aspectClass="h-full w-full"
          sizes="100vw"
          priority
          onClick={onImageClick}
        />
      </div>

      {/* Bottom gradient for title legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-shadow/70 via-shadow/30 to-transparent"
      />

      {/* Title overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col px-6 pb-20 md:px-12 md:pb-24 lg:px-16',
          titleAlignment,
          !reduced && 'opacity-0',
          !reduced && mounted && 'animate-hero-fade-in'
        )}
        style={reduced || !mounted ? undefined : { animationDelay: '300ms' }}
      >
        <h1 className="font-display text-[56px] uppercase leading-[1.05] tracking-[-0.01em] text-paper md:text-display-xl">
          {section.title}
        </h1>
      </div>

      {/* Scroll cue — same vocabulary as the homepage hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-mist">
            SCROLL
          </span>
          <span
            className={cn(
              'block h-10 w-px bg-mist',
              !reduced && 'animate-scroll-pulse'
            )}
          />
        </div>
      </div>
    </section>
  );
}
