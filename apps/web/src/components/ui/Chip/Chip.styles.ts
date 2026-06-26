import { tv } from 'tailwind-variants'

/**
 * Chip / pill component variants.
 * accent   — orange tint background + accent text (counts, highlights)
 * success  — green tint + green text + optional status dot
 * glass    — glass fill + secondary text (filters, labels)
 * neutral  — subtle neutral tint (default)
 */
export const chipVariants = tv({
  base: [
    'inline-flex items-center gap-1.5',
    'rounded-full px-[11px] py-[5px]',
    'font-body text-caption font-medium',
    'select-none whitespace-nowrap'
  ],
  defaultVariants: {
    variant: 'neutral'
  },
  variants: {
    variant: {
      accent: 'bg-accent-tint text-accent-text',
      glass: 'glass-card text-text-secondary',
      neutral: 'bg-white/[0.08] text-text-secondary',
      success: 'bg-success-tint text-success-text'
    }
  }
})
