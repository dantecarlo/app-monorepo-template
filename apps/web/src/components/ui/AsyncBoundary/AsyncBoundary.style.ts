import { tv } from '@/components/ui/variants.helper'

export const asyncBoundaryVariants = tv({
  slots: {
    loadingWrapper: ['flex flex-1 items-center justify-center p-8'],
    spinner: [
      'h-8 w-8 animate-spin rounded-full',
      'border-2 border-text-secondary border-t-accent'
    ]
  }
})
