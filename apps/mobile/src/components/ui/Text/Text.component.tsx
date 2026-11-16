import { Text as NativeText } from 'react-native'

import { TEXT_VARIANT_STYLES } from '@/components/ui/Text/Text.style'
import type { ITextProps } from '@/components/ui/Text/Text.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const Text = ({
  children,
  numberOfLines,
  style,
  variant
}: ITextProps) => {
  const variants = useThemedStyles({ styles: TEXT_VARIANT_STYLES })

  return (
    <NativeText
      numberOfLines={numberOfLines}
      style={[variant && variants[variant], style]}
    >
      {children}
    </NativeText>
  )
}
