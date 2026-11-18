import type { HTMLAttributes } from 'react'

import type {
  GlassCardPaddingType,
  GlassCardRadiusType
} from '@/components/ui/GlassCard/GlassCard.constant'

export interface IGlassCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: GlassCardPaddingType
  radius?: GlassCardRadiusType
}
