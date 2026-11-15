import { tv } from 'tailwind-variants'

// The surface a screen renders on: it fills the viewport and paints the base
// background, which flips with the theme.
export const screenVariants = tv({
  base: 'relative min-h-screen bg-bg-base'
})
