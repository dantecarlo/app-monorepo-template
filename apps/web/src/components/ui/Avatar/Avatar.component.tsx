import type { JSX } from 'react'
import type { VariantProps } from 'tailwind-variants'

import type { AvatarSizeType } from '@/components/ui/Avatar/Avatar.constant'
import { AVATAR_DEFAULT_SIZE } from '@/components/ui/Avatar/Avatar.constant'
import { avatarVariants } from '@/components/ui/Avatar/Avatar.styles'

export interface IAvatarProps extends VariantProps<typeof avatarVariants> {
  className?: string
  initials: string
  size?: AvatarSizeType
}

export const Avatar = ({
  className,
  initials,
  size = AVATAR_DEFAULT_SIZE,
  variant
}: IAvatarProps): JSX.Element => (
  <span
    aria-hidden="true"
    className={avatarVariants({ class: className, size, variant })}
  >
    {initials}
  </span>
)
