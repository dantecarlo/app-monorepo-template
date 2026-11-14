import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import type { ColorValue } from 'react-native'

import {
  GLASS_CARD_BORDER_RADIUS,
  GLASS_CARD_PADDING
} from '@/components/ui/GlassCard/GlassCard.style'

export type GlassCardPaddingType = keyof typeof GLASS_CARD_PADDING

export type GlassCardRadiusType = keyof typeof GLASS_CARD_BORDER_RADIUS

export interface IGlassCardProps extends ViewProps {
  children?: ReactNode
  padding?: GlassCardPaddingType
  radius?: GlassCardRadiusType
}

export type GlassCardTintType = 'dark' | 'light'

export interface IUseGlassCardResult {
  borderColor: ColorValue
  overlayColor: ColorValue
  tint: GlassCardTintType
}
