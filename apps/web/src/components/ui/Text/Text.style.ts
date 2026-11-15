import { tv } from '@/components/ui/variants.helper'

// The typography scale of the web app. A variant is a whole recipe (family,
// size, weight and colour); a tone and a weight style a text that takes its
// size from its parent, such as a count inside a row.
//
// Class merging stays off, though the shared tv knows the token font sizes:
// a tone or a weight set beside a variant keeps both classes, as it always
// has, where merging would drop the tone's colour or the variant's weight.
export const textVariants = tv(
  {
    variants: {
      tone: {
        accent: 'text-accent-text',
        danger: 'text-danger-text',
        primary: 'text-text-primary',
        secondary: 'text-text-secondary',
        success: 'text-success-text',
        tertiary: 'text-text-tertiary',
        warning: 'text-warning-text'
      },
      variant: {
        amount:
          'font-display text-amount font-bold text-text-primary tabular-nums',
        amountHero:
          'font-display text-amount-hero font-extrabold text-text-primary tabular-nums',
        body: 'font-body text-body text-text-primary',
        caption: 'font-body text-caption text-text-tertiary',
        eyebrow:
          'text-xs font-semibold uppercase tracking-widest text-text-secondary',
        heading: 'font-display text-heading font-bold text-text-primary',
        label: 'font-body text-label font-medium text-text-secondary',
        small: 'text-sm',
        title: 'font-display text-title font-semibold text-text-primary'
      },
      weight: {
        bold: 'font-bold',
        medium: 'font-medium',
        semibold: 'font-semibold'
      }
    }
  },
  { twMerge: false }
)
