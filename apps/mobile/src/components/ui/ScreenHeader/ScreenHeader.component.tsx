import { Text, View } from 'react-native'

import type { IconNameType } from '@/components/ui/Icon/Icon.component'
import { IconButton } from '@/components/ui/IconButton/IconButton.component'
import { SCREEN_HEADER_STYLES as styles } from '@/components/ui/ScreenHeader/ScreenHeader.styles'

export interface IScreenHeaderProps {
  actionLabel?: string
  actionName?: IconNameType
  backLabel: string
  onAction?: () => void
  onBack?: () => void
  title: string
}

/**
 * Fixed header with symmetric slots: back button (left) + title (center) +
 * optional trailing action (right). The equal-width slots keep the title
 * centred regardless of which side has a control.
 */
export const ScreenHeader = ({
  actionLabel,
  actionName,
  backLabel,
  onAction,
  onBack,
  title
}: IScreenHeaderProps) => {
  const hasAction =
    actionName !== undefined &&
    actionLabel !== undefined &&
    onAction !== undefined

  return (
    <View style={styles.root}>
      <View style={styles.slot}>
        {onBack !== undefined && (
          <IconButton
            accessibilityLabel={backLabel}
            name="chevron-left"
            onPress={onBack}
          />
        )}
      </View>

      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>

      <View style={styles.slot}>
        {hasAction && (
          <IconButton
            accessibilityLabel={actionLabel}
            name={actionName}
            onPress={onAction}
          />
        )}
      </View>
    </View>
  )
}
