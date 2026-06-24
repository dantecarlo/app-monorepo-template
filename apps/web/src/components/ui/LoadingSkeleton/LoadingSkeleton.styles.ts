import { tv } from 'tailwind-variants'

export const loadingSkeletonVariants = tv({
  defaultVariants: {
    rounded: 'md'
  },
  slots: {
    root: 'relative overflow-hidden bg-white/[0.08]',
    shimmer: 'absolute inset-0 animate-shimmer'
  },
  variants: {
    rounded: {
      full: 'rounded-full',
      lg: 'rounded-lg',
      md: 'rounded-md',
      sm: 'rounded-sm'
    }
  }
})
