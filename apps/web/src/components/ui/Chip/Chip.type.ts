import type { HTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { chipVariants } from '@/components/ui/Chip/Chip.styles'

export interface IChipProps
  extends
    HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  /** Renders a 7px status dot before the label (use with variant="success") */
  withDot?: boolean
}
