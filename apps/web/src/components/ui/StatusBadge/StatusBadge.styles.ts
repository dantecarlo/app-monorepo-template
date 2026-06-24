import { tv } from 'tailwind-variants'

export const statusBadgeVariants = tv({
  base: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-body',
  defaultVariants: {
    tone: 'neutral'
  },
  variants: {
    tone: {
      danger: 'bg-danger-tint text-danger',
      neutral: 'bg-neutral-tint text-text-secondary',
      success: 'bg-success-tint text-success',
      warning: 'bg-warning-tint text-warning'
    }
  }
})

export const statusBadgeDotVariants = tv({
  base: 'h-1.5 w-1.5 shrink-0 rounded-full',
  defaultVariants: {
    tone: 'neutral'
  },
  variants: {
    tone: {
      danger: 'bg-danger',
      neutral: 'bg-text-secondary',
      success: 'bg-success',
      warning: 'bg-warning'
    }
  }
})
