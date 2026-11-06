import type { VariantProps } from 'tailwind-variants'

import type { AvatarSizeType } from '@/components/ui/Avatar/Avatar.constant'
import { avatarVariants } from '@/components/ui/Avatar/Avatar.styles'

export interface IAvatarProps extends VariantProps<typeof avatarVariants> {
  className?: string
  initials: string
  size?: AvatarSizeType
}
