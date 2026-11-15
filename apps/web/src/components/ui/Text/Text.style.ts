import { tv } from 'tailwind-variants'

// The typography scale of the web app. A variant is a whole recipe (family,
// size, weight and colour); a tone and a weight style a text that takes its
// size from its parent, such as a count inside a row.
//
// Class merging is off: tailwind-merge reads a token font size (text-title)
// as a colour, so merging would drop it next to text-text-primary.
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
