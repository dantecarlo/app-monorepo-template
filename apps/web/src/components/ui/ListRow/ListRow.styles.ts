import { tv } from 'tailwind-variants'

export const listRowVariants = tv({
  base: 'flex items-center gap-3 px-4 py-3 border-t border-divider first:border-t-0'
})

export const listRowInteractiveVariants = tv({
  base: 'w-full text-left cursor-pointer hover:bg-neutral-tint transition-colors'
})
