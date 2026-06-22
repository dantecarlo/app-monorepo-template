import { tv } from 'tailwind-variants'

/**
 * Button style variants via tailwind-variants.
 * Variants: primary | secondary | ghost
 * Sizes: sm | md (default) | lg
 */
export const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center gap-2',
    'rounded-full font-display text-button font-bold',
    'transition-all duration-[120ms] ease-out',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'disabled:opacity-40 disabled:pointer-events-none',
    'cursor-pointer select-none'
  ],
  defaultVariants: {
    size: 'md',
    variant: 'primary'
  },
  variants: {
    fullWidth: {
      true: 'w-full'
    },
    size: {
      lg: 'h-14 px-8 text-heading',
      md: 'h-12 px-6',
      sm: 'h-9 px-4 text-label'
    },
    variant: {
      ghost: ['bg-transparent text-accent', 'hover:bg-accent-tint'],
      primary: [
        'bg-accent-gradient text-accent-ink',
        'shadow-accent-glow',
        'hover:brightness-110'
      ],
      secondary: ['glass-card text-text-primary', 'hover:brightness-110']
    }
  }
})
