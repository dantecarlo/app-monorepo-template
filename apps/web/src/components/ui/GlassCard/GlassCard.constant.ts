// The option names of each variant of the block's tv config, and the union
// its props take; the block's constant test holds them to the config.
export const GLASS_CARD_PADDING_VARIANTS = ['lg', 'md', 'none'] as const
export type GlassCardPaddingType =
  (typeof GLASS_CARD_PADDING_VARIANTS)[number]
export const GLASS_CARD_RADIUS_VARIANTS = ['lg', 'xl'] as const
export type GlassCardRadiusType =
  (typeof GLASS_CARD_RADIUS_VARIANTS)[number]
