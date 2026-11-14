import { tv } from 'tailwind-variants'

export const iconButtonVariants = tv({
  base: 'inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  defaultVariants: {
    variant: 'glass'
  },
  variants: {
    variant: {
      accent: 'bg-accent text-accent-ink shadow-accent-glow h-10 w-10',
      glass: 'glass-card text-text-secondary h-10 w-10'
    }
  }
})
