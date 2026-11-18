// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const BUTTON_SIZE_VARIANTS = ['lg', 'md', 'sm'] as const
export type ButtonSizeType = (typeof BUTTON_SIZE_VARIANTS)[number]
export const BUTTON_VARIANT_VARIANTS = [
  'ghost',
  'primary',
  'secondary'
] as const
export type ButtonVariantType = (typeof BUTTON_VARIANT_VARIANTS)[number]
