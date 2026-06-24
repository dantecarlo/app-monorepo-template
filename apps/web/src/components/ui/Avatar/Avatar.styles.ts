import { tv } from 'tailwind-variants'

export const avatarVariants = tv({
  base: 'inline-flex items-center justify-center font-body font-semibold select-none rounded-full',
  defaultVariants: {
    size: 36,
    variant: 'neutral'
  },
  variants: {
    size: {
      28: 'h-7 w-7 text-[10px]',
      36: 'h-9 w-9 text-[13px]',
      44: 'h-11 w-11 text-[16px]'
    },
    variant: {
      accent: 'bg-accent-tint text-accent',
      glass: 'glass-card text-text-secondary',
      neutral: 'bg-neutral-tint text-text-secondary'
    }
  }
})
