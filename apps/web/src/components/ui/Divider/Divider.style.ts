import { tv } from '@/components/ui/variants.helper'

// A horizontal rule, with an optional label between two halves.
export const dividerVariants = tv({
  slots: {
    label: 'font-body text-caption text-text-tertiary',
    root: 'flex items-center gap-3',
    rule: 'h-px flex-1 bg-divider'
  }
})
