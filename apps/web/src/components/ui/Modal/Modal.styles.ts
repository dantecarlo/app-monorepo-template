import { tv } from 'tailwind-variants'

export const MODAL_CLOSE_BTN =
  'absolute right-4 top-4 rounded-full p-1 text-text-secondary ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent transition-colors'

export const MODAL_TITLE =
  'text-heading font-display text-text-primary pr-8'

export const MODAL_BODY = 'text-body font-body text-text-secondary'

export const modalScrimVariants = tv({
  base: [
    'fixed inset-0 z-50 flex items-center justify-center',
    'bg-black/60 backdrop-blur-sm',
    'animate-in fade-in duration-200'
  ]
})

export const modalPanelVariants = tv({
  base: [
    'glass-card relative w-full rounded-xl p-5',
    'flex flex-col gap-4',
    'animate-in zoom-in-95 duration-200'
  ],
  defaultVariants: {
    size: 'md'
  },
  variants: {
    size: {
      lg: 'max-w-[42rem]',
      md: 'max-w-[32rem]',
      sm: 'max-w-[24rem]'
    }
  }
})
