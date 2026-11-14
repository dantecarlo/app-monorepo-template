import { tv } from 'tailwind-variants'

export const offlineBannerVariants = tv({
  base: [
    'fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2',
    'bg-warning/[0.16] px-4 py-2 backdrop-blur-md',
    'border-b border-warning/30',
    'font-body text-label font-medium text-warning-text',
    'animate-in fade-in slide-in-from-top-2 duration-200'
  ]
})
