import type { JSX } from 'react'

import { AVATAR_DEFAULT_SIZE } from '@/components/ui/Avatar/Avatar.constant'
import { avatarVariants } from '@/components/ui/Avatar/Avatar.style'
import type { IAvatarProps } from '@/components/ui/Avatar/Avatar.type'

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
