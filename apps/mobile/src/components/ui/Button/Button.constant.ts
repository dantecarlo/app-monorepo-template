export const PRESS_OPACITY = 0.7
export const BUTTON_SIZE_VARIANTS = ['sm', 'md', 'lg'] as const
export type ButtonSizeType = (typeof BUTTON_SIZE_VARIANTS)[number]
export const BUTTON_VARIANT_VARIANTS = [
  'primary',
  'secondary',
  'ghost'
] as const
export type ButtonVariantType = (typeof BUTTON_VARIANT_VARIANTS)[number]
