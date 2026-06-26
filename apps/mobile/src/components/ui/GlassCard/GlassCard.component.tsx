import { BlurView } from 'expo-blur'
import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import {
  GLASS_CARD_BORDER_RADIUS,
  GLASS_CARD_PADDING,
  GLASS_CARD_STYLES as styles
} from '@/components/ui/GlassCard/GlassCard.styles'
import { useGlassCard } from '@/components/ui/GlassCard/useGlassCard.hook'

export type GlassCardPaddingType = keyof typeof GLASS_CARD_PADDING
export type GlassCardRadiusType = keyof typeof GLASS_CARD_BORDER_RADIUS

export interface IGlassCardProps extends ViewProps {
  children?: ReactNode
  padding?: GlassCardPaddingType
  radius?: GlassCardRadiusType
}

/** Glass surface backed by expo-blur + glass.fill overlay + 1px stroke. */
export const GlassCard = ({
  children,
  padding = 'lg',
  radius = 'xl',
  style,
  ...props
}: IGlassCardProps) => {
  const borderRadius = GLASS_CARD_BORDER_RADIUS[radius]
  const paddingValue = GLASS_CARD_PADDING[padding]
  const { borderColor, overlayColor, tint } = useGlassCard()

  return (
    <View
      style={[styles.root, { borderColor, borderRadius }, style]}
      {...props}
    >
      <BlurView
        intensity={60}
        style={[styles.blur, { borderRadius }]}
        tint={tint}
      />
      <View
        style={[
          styles.overlay,
          { backgroundColor: overlayColor, borderRadius }
        ]}
      />
      <View style={[styles.content, { padding: paddingValue }]}>
        {children}
      </View>
    </View>
  )
}
