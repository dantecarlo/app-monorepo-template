import type { ReactNode } from 'react'

import type { ChipVariantType } from '@/components/ui/Chip/Chip.constant'

export interface IChipProps {
  children: ReactNode
  variant?: ChipVariantType
  withDot?: boolean
}
