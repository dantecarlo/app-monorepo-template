import type { HTMLAttributes } from 'react'

import type { ChipVariantType } from '@/components/ui/Chip/Chip.constant'

export interface IChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariantType
  /** Renders a 7px status dot before the label (use with variant="success") */
  withDot?: boolean
}
