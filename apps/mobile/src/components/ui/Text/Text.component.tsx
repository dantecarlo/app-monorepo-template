import { Text as NativeText } from 'react-native'

import { TEXT_VARIANT_STYLES } from '@/components/ui/Text/Text.style'
import type { ITextProps } from '@/components/ui/Text/Text.type'

export const Text = ({
  children,
  numberOfLines,
  style,
  variant
}: ITextProps) => (
  <NativeText
    numberOfLines={numberOfLines}
    style={[variant && TEXT_VARIANT_STYLES[variant], style]}
  >
    {children}
  </NativeText>
)
