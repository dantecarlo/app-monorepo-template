import { LinearGradient } from 'expo-linear-gradient'

import { ACCENT_GRADIENT_COLORS } from '@/components/ui/AccentGradient/AccentGradient.style'
import type { IAccentGradientProps } from '@/components/ui/AccentGradient/AccentGradient.type'

// A surface painted with the accent gradient. The gradient library stays in
// components/ui, so the screens never import it.
export const AccentGradient = ({
  accessibilityLabel,
  children,
  style
}: IAccentGradientProps) => (
  <LinearGradient
    accessibilityLabel={accessibilityLabel}
    colors={ACCENT_GRADIENT_COLORS}
    style={style}
  >
    {children}
  </LinearGradient>
)
