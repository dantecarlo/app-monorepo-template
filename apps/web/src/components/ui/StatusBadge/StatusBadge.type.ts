import type { VariantProps } from 'tailwind-variants'

import { statusBadgeVariants } from '@/components/ui/StatusBadge/StatusBadge.styles'

export interface IStatusBadgeProps extends VariantProps<
  typeof statusBadgeVariants
> {
  label: string
}
