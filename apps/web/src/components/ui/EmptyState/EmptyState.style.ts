import { tv } from 'tailwind-variants'

export const emptyStateVariants = tv({
  slots: {
    container:
      'glass-card flex flex-col items-center gap-4 rounded-xl p-8 text-center',
    ctaWrapper: 'mt-2',
    iconWrapper:
      'flex h-16 w-16 items-center justify-center rounded-full bg-neutral-tint',
    message: 'text-body font-body text-text-secondary',
    title: 'text-heading font-display text-text-primary'
  }
})
