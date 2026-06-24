import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  SETTING_ROW_CHEVRON_SIZE,
  SETTING_ROW_STYLES as styles
} from '@/components/ui/SettingRow/SettingRow.styles'

export interface ISettingRowProps {
  control?: ReactNode
  isFirst?: boolean
  label: string
  leading?: ReactNode
  onPress?: () => void
  subtitle?: string
  value?: string
}

/**
 * Settings list row: leading slot + label/subtitle + trailing value/control
 * or chevron when the row is interactive. Pass `control` to override the
 * value/chevron area with a custom element (e.g. Toggle, StatusBadge).
 */
export const SettingRow = ({
  control,
  isFirst = false,
  label,
  leading,
  onPress,
  subtitle,
  value
}: ISettingRowProps) => {
  const containerStyle = [
    styles.container,
    isFirst ? undefined : styles.divider
  ]

  const trailing = (() => {
    if (control !== undefined) return control
    if (value !== undefined)
      return <Text style={styles.value}>{value}</Text>
    if (onPress !== undefined)
      return (
        <Icon
          color={styles.value.color}
          decorative
          name="chevron-right"
          size={SETTING_ROW_CHEVRON_SIZE}
        />
      )
    return null
  })()

  const inner = (
    <>
      {leading !== undefined && (
        <View style={styles.leading}>{leading}</View>
      )}
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        {subtitle !== undefined && (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing !== null && (
        <View style={styles.trailing}>{trailing}</View>
      )}
    </>
  )

  if (onPress !== undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && { opacity: 0.7 }
        ]}
      >
        {inner}
      </Pressable>
    )
  }

  return <View style={containerStyle}>{inner}</View>
}
