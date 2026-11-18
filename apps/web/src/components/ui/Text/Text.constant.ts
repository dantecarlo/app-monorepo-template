// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const TEXT_TONE_VARIANTS = [
  'accent',
  'danger',
  'primary',
  'secondary',
  'success',
  'tertiary',
  'warning'
] as const
export type TextToneType = (typeof TEXT_TONE_VARIANTS)[number]
export const TEXT_VARIANT_VARIANTS = [
  'amount',
  'amountHero',
  'body',
  'caption',
  'eyebrow',
  'heading',
  'label',
  'small',
  'title'
] as const
export type TextVariantType = (typeof TEXT_VARIANT_VARIANTS)[number]
export const TEXT_WEIGHT_VARIANTS = ['bold', 'medium', 'semibold'] as const
export type TextWeightType = (typeof TEXT_WEIGHT_VARIANTS)[number]
