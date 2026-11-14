import type { JSX } from 'react'

import {
  statusBadgeDotVariants,
  statusBadgeVariants
} from '@/components/ui/StatusBadge/StatusBadge.style'
import type { IStatusBadgeProps } from '@/components/ui/StatusBadge/StatusBadge.type'

export const StatusBadge = ({
  label,
  tone
}: IStatusBadgeProps): JSX.Element => (
  <span className={statusBadgeVariants({ tone })}>
    <span className={statusBadgeDotVariants({ tone })} />
    {label}
  </span>
)
