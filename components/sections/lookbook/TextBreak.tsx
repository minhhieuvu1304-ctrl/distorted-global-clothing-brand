import type { TextBreakSection } from '@/lib/types';
import { FadeIn } from '@/components/ui/FadeIn';
import { cn } from '@/lib/cn';

/**
 * TextBreak
 *
 * Spec §6 + Prompt 6 §1. A single Bodoni line on a dark backdrop —
 * no image, no chrome. Used as a rhythmic pause between dense visual
 * sequences.
 *
 * 60-80vh per spec. Text size scales to feel meaningful at any
 * viewport — 36-40px mobile, 56-64px tablet, 72px desktop. Fades in
 * via <FadeIn /> as the section enters viewport.
 *
 * Server component — no client interactivity needed.
 */
interface TextBreakProps {
  section: TextBreakSection;
}

export function TextBreak({ section }: TextBreakProps) {
  const align = section.align ?? 'center';

  return (
    <section
      aria-label="Lookbook text"
      className="flex min-h-[60vh] items-center bg-ink md:min-h-[70vh]"
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[1440px] px-6 py-20 md:px-12 md:py-32 lg:px-16',
          align === 'center' ? 'text-center' : 'text-left'
        )}
      >
        <FadeIn>
          <p
            className={cn(
              'font-display text-paper',
              'text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] lg:text-[72px]',
              align === 'left' && 'md:max-w-[80%]'
            )}
          >
            {section.copy}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
