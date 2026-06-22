import { tv } from 'tailwind-variants'

export const glassCardVariants = tv({
  base: 'glass-card',
  defaultVariants: {
    padding: 'lg',
    radius: 'xl'
  },
  variants: {
    padding: {
      lg: 'p-5',
      md: 'p-4',
      none: ''
    },
    radius: {
      lg: 'rounded-lg', // 20px — nested/inner cards
      xl: 'rounded-xl' // 26px — main surface cards
    }
  }
})
