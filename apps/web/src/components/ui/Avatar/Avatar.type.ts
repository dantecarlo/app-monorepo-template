import type {
  AvatarSizeType,
  AvatarVariantType
} from '@/components/ui/Avatar/Avatar.constant'

export interface IAvatarProps {
  className?: string
  initials: string
  size?: AvatarSizeType
  variant?: AvatarVariantType
}
