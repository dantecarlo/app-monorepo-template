import { tv } from '@/components/ui/variants.helper'

export const avatarVariants = tv({
  base: 'inline-flex items-center justify-center font-body font-semibold select-none rounded-full',
  defaultVariants: {
    size: 36,
    variant: 'neutral'
  },
  variants: {
    size: {
      28: 'h-7 w-7 text-initials-sm',
      36: 'h-9 w-9 text-initials-md',
      44: 'h-11 w-11 text-initials-lg'
    },
    variant: {
      accent: 'bg-accent-tint text-accent-text',
      glass: 'glass-card text-text-secondary',
      neutral: 'bg-neutral-tint text-text-secondary'
    }
  }
})
