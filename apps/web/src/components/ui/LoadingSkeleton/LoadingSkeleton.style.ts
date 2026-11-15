import { tv } from 'tailwind-variants'

export const loadingSkeletonVariants = tv({
  defaultVariants: {
    rounded: 'md'
  },
  slots: {
    root: 'relative overflow-hidden bg-neutral-tint',
    shimmer: 'absolute inset-0 animate-shimmer'
  },
  variants: {
    rounded: {
      full: { root: 'rounded-full' },
      lg: { root: 'rounded-lg' },
      md: { root: 'rounded-md' },
      sm: { root: 'rounded-sm' }
    }
  }
})
