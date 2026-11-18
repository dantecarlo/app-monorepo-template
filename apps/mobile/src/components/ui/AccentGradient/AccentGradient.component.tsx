import { ACCENT_GRADIENT_COLORS } from '@/components/ui/AccentGradient/AccentGradient.style'
import type { IAccentGradientProps } from '@/components/ui/AccentGradient/AccentGradient.type'
import { Gradient } from '@/components/ui/Gradient/Gradient.component'

// A surface painted with the accent gradient, from the light accent to the
// accent, top to bottom.
export const AccentGradient = ({
  accessibilityLabel,
  children,
  style
}: IAccentGradientProps) => (
  <Gradient
    accessibilityLabel={accessibilityLabel}
    colors={ACCENT_GRADIENT_COLORS}
    style={style}
  >
    {children}
  </Gradient>
)
