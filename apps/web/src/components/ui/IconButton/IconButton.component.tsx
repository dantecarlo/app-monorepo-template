import type { JSX } from 'react'

import { Icon } from '@/components/ui/Icon/Icon.component'
import { ICON_BUTTON_DEFAULT_ICON_SIZE } from '@/components/ui/IconButton/IconButton.constant'
import { iconButtonVariants } from '@/components/ui/IconButton/IconButton.styles'
import type { IIconButtonProps } from '@/components/ui/IconButton/IconButton.type'

export const IconButton = ({
  accessibilityLabel,
  className,
  name,
  variant,
  ...props
}: IIconButtonProps): JSX.Element => (
  <button
    aria-label={accessibilityLabel}
    className={iconButtonVariants({ class: className, variant })}
    type="button"
    {...props}
  >
    <Icon decorative name={name} size={ICON_BUTTON_DEFAULT_ICON_SIZE} />
  </button>
)
