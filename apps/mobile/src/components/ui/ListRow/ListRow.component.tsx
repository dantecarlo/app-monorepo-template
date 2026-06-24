import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

import { LIST_ROW_STYLES as styles } from '@/components/ui/ListRow/ListRow.styles'

export interface IListRowProps {
  isFirst?: boolean
  leading?: ReactNode
  onPress?: () => void
  subtitle?: string
  title: string
  trailing?: ReactNode
}

/** Generic list item with optional leading/trailing slots and divider. */
export const ListRow = ({
  isFirst = false,
  leading,
  onPress,
  subtitle,
  title,
  trailing
}: IListRowProps) => {
  const containerStyle = [
    styles.container,
    isFirst ? undefined : styles.divider
  ]

  const inner = (
    <>
      {leading !== undefined && (
        <View style={styles.leading}>{leading}</View>
      )}
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing !== undefined && (
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
