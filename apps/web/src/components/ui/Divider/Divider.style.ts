import { tv } from 'tailwind-variants'

// A horizontal rule, with an optional label between two halves. Merging is
// off for the token font size (text-caption), as in Text.
export const dividerVariants = tv(
  {
    slots: {
      label: 'font-body text-caption text-text-tertiary',
      root: 'flex items-center gap-3',
      rule: 'h-px flex-1 bg-divider'
    }
  },
  { twMerge: false }
)
