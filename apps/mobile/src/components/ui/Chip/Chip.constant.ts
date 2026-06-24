export const CHIP_VARIANT_VARIANTS = [
  'neutral',
  'accent',
  'success',
  'glass'
] as const
export type ChipVariantType = (typeof CHIP_VARIANT_VARIANTS)[number]
export const CHIP_DOT_SIZE_CLASS =
  'h-[7px] w-[7px] rounded-full bg-current'
