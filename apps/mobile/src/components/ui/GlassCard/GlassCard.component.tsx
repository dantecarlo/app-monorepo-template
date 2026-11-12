import { BlurView } from 'expo-blur'
import { View } from 'react-native'

import {
  GLASS_CARD_BORDER_RADIUS,
  GLASS_CARD_PADDING,
  GLASS_CARD_STYLES as styles
} from '@/components/ui/GlassCard/GlassCard.styles'
import type { IGlassCardProps } from '@/components/ui/GlassCard/GlassCard.type'
import { useGlassCard } from '@/components/ui/GlassCard/useGlassCard.hook'

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
