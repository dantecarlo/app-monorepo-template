import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop
} from 'react-native-svg'

import {
  DEFAULT_LOGO_SIZE,
  LOGO_GRADIENT_FROM,
  LOGO_GRADIENT_TO,
  LOGO_MARK_COLOR,
  LOGO_MARK_PATH,
  LOGO_MARK_STROKE_WIDTH,
  LOGO_RADIUS,
  LOGO_VIEW_BOX
} from '@/components/ui/Logo/logo.constant'
import { LOGO_STYLES as styles } from '@/components/ui/Logo/Logo.styles'
import { useLogo } from '@/components/ui/Logo/useLogo.hook'

const LOGO_GRADIENT_ID = 'logoPlaceholderGradient'

export interface ILogoProps {
  brandLabel: string
  hasAsset?: boolean
  size?: number
}

/**
 * Generic brand mark: renders the per-project SVG asset placeholder when
 * present and falls back to a brandLabel wordmark when the slot is empty.
 */
export const Logo = ({
  brandLabel,
  hasAsset = true,
  size = DEFAULT_LOGO_SIZE
}: ILogoProps) => {
  const { t } = useTranslation()
  const { showWordmark } = useLogo({ hasAsset })
  const altLabel = t('auth.logo.label', { name: brandLabel })

  if (showWordmark) {
    return (
      <View
        accessibilityLabel={altLabel}
        accessibilityRole="image"
        style={[
          styles.wordmark,
          { backgroundColor: LOGO_GRADIENT_TO, height: size }
        ]}
      >
        <Text style={[styles.wordmarkText, { color: LOGO_MARK_COLOR }]}>
          {brandLabel}
        </Text>
      </View>
    )
  }

  return (
    <Svg
      accessibilityLabel={altLabel}
      accessibilityRole="image"
      height={size}
      viewBox={LOGO_VIEW_BOX}
      width={size}
    >
      <Defs>
        <LinearGradient id={LOGO_GRADIENT_ID} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={LOGO_GRADIENT_FROM} />
          <Stop offset="1" stopColor={LOGO_GRADIENT_TO} />
        </LinearGradient>
      </Defs>
      <Rect
        fill={`url(#${LOGO_GRADIENT_ID})`}
        height={size}
        rx={LOGO_RADIUS}
        width={size}
      />
      <Path
        d={LOGO_MARK_PATH}
        fill="none"
        stroke={LOGO_MARK_COLOR}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={LOGO_MARK_STROKE_WIDTH}
      />
    </Svg>
  )
}
