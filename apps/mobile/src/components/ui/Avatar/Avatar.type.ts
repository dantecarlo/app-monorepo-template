import type { AvatarSizeType } from '@/components/ui/Avatar/Avatar.constant'
import type { AvatarVariantType } from '@/components/ui/Avatar/Avatar.styles'

export interface IAvatarProps {
  initials: string
  size?: AvatarSizeType
  variant?: AvatarVariantType
}
