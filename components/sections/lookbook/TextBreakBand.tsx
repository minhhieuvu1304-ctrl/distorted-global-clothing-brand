import { FadeIn } from '@/components/ui/FadeIn';
import { cn } from '@/lib/cn';

/**
 * TextBreakBand — compact text interruption for the masonry lookbook.
 *
 * Replaces the old <TextBreak /> (60-80vh) with a tighter (~30vh)
 * full-width band so the page still has rhythm pauses without giving
 * up the Pinterest-style density.
 *
 * Server component — no client interactivity needed (the FadeIn child
 * handles its own intersection-observer mount).
 */
interface TextBreakBandProps {
  copy: string;
  /** Default 'center'. */
  align?: 'left' | 'center';
}

export function TextBreakBand({ copy, align = 'center' }: TextBreakBandProps) {
  return (
    <section
      aria-label="Lookbook interlude"
      // Compact height — used to be 60-70vh; now ~30vh on desktop,
      // ~25vh on mobile. Still feels like a deliberate pause but
      // doesn't eat the whole viewport.
      className="flex min-h-[25vh] items-center bg-ink py-12 md:min-h-[30vh] md:py-20"
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[1200px] px-6 md:px-12',
          align === 'center' ? 'text-center' : 'text-left'
        )}
      >
        <FadeIn>
          <p
            className={cn(
              'font-display text-paper',
              // Slightly smaller than the old TextBreak too — felt
              // outsized at 72px alongside compact masonry cards.
              'text-[28px] leading-[1.15] md:text-[40px] md:leading-[1.1] lg:text-[52px]',
              align === 'left' && 'md:max-w-[80%]'
            )}
          >
            {copy}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
