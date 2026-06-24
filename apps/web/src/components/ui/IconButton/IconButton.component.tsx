import type { ButtonHTMLAttributes, JSX } from 'react'
import type { VariantProps } from 'tailwind-variants'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import { Icon } from '@/components/ui/Icon/Icon.component'
import { ICON_BUTTON_DEFAULT_ICON_SIZE } from '@/components/ui/IconButton/IconButton.constant'
import { iconButtonVariants } from '@/components/ui/IconButton/IconButton.styles'

export interface IIconButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  accessibilityLabel: string
  name: IconNameType
}

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
