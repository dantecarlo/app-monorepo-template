import { tv } from 'tailwind-variants';

export const glassCardVariants = tv({
  base: 'glass-card',
  variants: {
    radius: {
      lg: 'rounded-lg',  // 20px — nested/inner cards
      xl: 'rounded-xl',  // 26px — main surface cards
    },
    padding: {
      none: '',
      md: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: {
    radius: 'xl',
    padding: 'lg',
  },
});
