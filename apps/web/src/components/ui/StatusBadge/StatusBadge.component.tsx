import type { JSX } from 'react'
import type { VariantProps } from 'tailwind-variants'

import {
  statusBadgeDotVariants,
  statusBadgeVariants
} from '@/components/ui/StatusBadge/StatusBadge.styles'

export interface IStatusBadgeProps extends VariantProps<
  typeof statusBadgeVariants
> {
  label: string
}

export const StatusBadge = ({
  label,
  tone
}: IStatusBadgeProps): JSX.Element => (
  <span className={statusBadgeVariants({ tone })}>
    <span className={statusBadgeDotVariants({ tone })} />
    {label}
  </span>
)
