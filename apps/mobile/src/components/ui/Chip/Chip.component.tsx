import { Text, View } from 'react-native'

import { CHIP_DOT_SIZE_CLASS } from '@/components/ui/Chip/Chip.constant'
import {
  CHIP_BASE_CLASS,
  CHIP_TEXT_BASE_CLASS,
  CHIP_TEXT_VARIANT_CLASS,
  CHIP_VARIANT_CLASS
} from '@/components/ui/Chip/Chip.style'
import type { IChipProps } from '@/components/ui/Chip/Chip.type'

export const Chip = ({
  children,
  variant = 'neutral',
  withDot
}: IChipProps) => {
  const containerClass = [
    CHIP_BASE_CLASS,
    CHIP_VARIANT_CLASS[variant]
  ].join(' ')

  const textClass = [
    CHIP_TEXT_BASE_CLASS,
    CHIP_TEXT_VARIANT_CLASS[variant]
  ].join(' ')

  return (
    <View accessible={false} className={containerClass}>
      {withDot === true && (
        <View
          accessibilityElementsHidden
          className={CHIP_DOT_SIZE_CLASS}
        />
      )}
      <Text className={textClass}>{children}</Text>
    </View>
  )
}
