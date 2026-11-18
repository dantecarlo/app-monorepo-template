export const ICON_BUTTON_CONTAINER_SIZE = 40
export const ICON_BUTTON_DEFAULT_ICON_SIZE = 20

// The option names of the button's variant, and the union its props take; the
// block's constant test holds them to its tv config.
export const ICON_BUTTON_VARIANT_VARIANTS = ['accent', 'glass'] as const
export type IconButtonVariantType =
  (typeof ICON_BUTTON_VARIANT_VARIANTS)[number]
