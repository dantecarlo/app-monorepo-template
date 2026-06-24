export type AvatarSizeType = 28 | 36 | 44

export const AVATAR_DEFAULT_SIZE: AvatarSizeType = 36

export const AVATAR_SIZES = [
  28, 36, 44
] as const satisfies readonly AvatarSizeType[]
