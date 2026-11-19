import { Text as NativeText } from 'react-native'

import { TEXT_VARIANT_STYLES } from '@/components/ui/Text/Text.style'
import type { ITextProps } from '@/components/ui/Text/Text.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

/**
 * The one wrapper of react-native's Text: every text of the app renders
 * through it (local/wrapped-import), so its typography lives in one block.
 */
export const Text = ({
  accessibilityRole,
  children,
  className,
  numberOfLines,
  style,
  variant
}: ITextProps) => {
  const variants = useThemedStyles({ styles: TEXT_VARIANT_STYLES })

  return (
    <NativeText
      accessibilityRole={accessibilityRole}
      className={className}
      numberOfLines={numberOfLines}
      style={[variant && variants[variant], style]}
    >
      {children}
    </NativeText>
  )
}
