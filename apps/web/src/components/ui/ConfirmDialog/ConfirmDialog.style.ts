import { tv } from 'tailwind-variants'

export const CONFIRM_DIALOG_ACTIONS = 'flex justify-end gap-3 pt-2'

export const CANCEL_BUTTON =
  'rounded-full px-4 py-2 text-label font-display font-bold text-text-secondary ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent transition-colors cursor-pointer select-none'

export const confirmButtonVariants = tv({
  base: [
    'inline-flex items-center justify-center rounded-full px-4 py-2',
    'text-label font-display font-bold',
    'focus-visible:outline-none focus-visible:ring-2',
    'transition-all active:scale-[0.97] cursor-pointer select-none'
  ],
  defaultVariants: {
    tone: 'accent'
  },
  variants: {
    tone: {
      accent: [
        'bg-accent-gradient text-accent-ink shadow-accent-glow',
        'hover:brightness-110 focus-visible:ring-accent'
      ],
      destructive: [
        'bg-danger text-text-primary',
        'hover:brightness-110 focus-visible:ring-danger'
      ]
    }
  }
})
