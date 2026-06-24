export type AvatarSizeType = 28 | 36 | 44

export const AVATAR_DEFAULT_SIZE: AvatarSizeType = 36

export const AVATAR_SIZES = [
  28, 36, 44
] as const satisfies readonly AvatarSizeType[]

export const AVATAR_FONT_SIZES: Record<AvatarSizeType, number> = {
  28: 10,
  36: 13,
  44: 16
}
