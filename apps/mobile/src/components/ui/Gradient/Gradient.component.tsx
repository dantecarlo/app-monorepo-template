import { LinearGradient } from 'expo-linear-gradient'

import type { IGradientProps } from '@/components/ui/Gradient/Gradient.type'

// A surface painted with a linear gradient. The gradient library stays in this
// block, so every other block paints a gradient by rendering this one.
export const Gradient = ({
  accessibilityLabel,
  children,
  colors,
  end,
  start,
  style
}: IGradientProps) => (
  <LinearGradient
    accessibilityLabel={accessibilityLabel}
    colors={colors}
    end={end}
    start={start}
    style={style}
  >
    {children}
  </LinearGradient>
)
