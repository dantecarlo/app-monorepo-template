export type AvatarSizeType = 28 | 36 | 44

export const AVATAR_DEFAULT_SIZE: AvatarSizeType = 36

export const AVATAR_SIZES = [
  28, 36, 44
] as const satisfies readonly AvatarSizeType[]

// The option names of the avatar's variant, and the union its props take; the
// block's constant test holds them and the sizes to its tv config.
export const AVATAR_VARIANT_VARIANTS = [
  'accent',
  'glass',
  'neutral'
] as const
export type AvatarVariantType = (typeof AVATAR_VARIANT_VARIANTS)[number]
