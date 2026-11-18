// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const CHIP_VARIANT_VARIANTS = [
  'accent',
  'glass',
  'neutral',
  'success'
] as const
export type ChipVariantType = (typeof CHIP_VARIANT_VARIANTS)[number]
