'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Input
 *
 * Spec §2 form inputs (LOCKED):
 *   - Transparent background, 1px bottom border `--steel`
 *   - Focus state: bottom border `--paper`
 *   - Inter 15px, paper text, fog placeholder
 *
 * Prompt 2 §2 additions:
 *   - Error state: bottom border `--alert` (#B84A3E, added to tokens)
 *   - Optional uppercase Inter caption label above the input
 *
 * Variants are HTML `type` values exposed as a typed prop. The visual
 * style is identical for all input types — only the keyboard/validation
 * behavior differs.
 *
 * Use the `label` prop for the visible Inter caption above the field;
 * if no label is provided, an `aria-label` should be set instead for
 * screen-reader accessibility.
 *
 * `error` doubles as both the error state flag and the visible message.
 * Pass an empty string `''` to keep the alert border without a message,
 * or `undefined`/null to clear the error state entirely.
 */

type InputVariant = 'email' | 'tel' | 'text';

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** Maps to HTML input type. Default 'text'. */
  variant?: InputVariant;
  /** Visible Inter caption above the field. */
  label?: string;
  /** Error message — empty string activates state without text. */
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'text', label, error, className, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = error !== undefined && error !== null;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-sans text-caption uppercase text-mist"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={variant}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        className={cn(
          // Base — 15px Inter (text-body), paper text, transparent bg
          'w-full bg-transparent font-sans text-body text-paper',
          'placeholder:text-steel',
          // Bottom border only — top/left/right transparent so it's a single line
          'border-0 border-b border-solid',
          hasError ? 'border-alert' : 'border-steel',
          // Focus: paper border (or stay alert if error)
          'transition-colors duration-300 ease-out',
          !hasError && 'focus:border-paper',
          'focus:outline-none focus:ring-0',
          // Vertical rhythm — generous padding so the underline reads as a field
          'py-3'
        )}
        {...rest}
      />
      {hasError && error.length > 0 && (
        <p
          id={`${inputId}-error`}
          className="mt-2 font-sans text-caption text-alert"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});
