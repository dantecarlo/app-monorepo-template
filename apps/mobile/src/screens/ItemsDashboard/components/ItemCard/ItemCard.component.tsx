import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import {
  ITEM_CARD,
  STATUS_COLOR
} from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.style'
import type { IItemCardProps } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.type'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ItemCard = ({ isLast = false, item }: IItemCardProps) => {
  const { t } = useAppTranslator()
  const styles = useThemedStyles({ styles: ITEM_CARD })
  const statusColors = useThemedStyles({ styles: STATUS_COLOR })

  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      {/* Author avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText} variant="label">
          {item.authorInitials}
        </Text>
      </View>

      {/* Main content */}
      <View style={styles.middle}>
        <Text numberOfLines={1} variant="body">
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          style={styles.description}
          variant="caption"
        >
          {item.description}
        </Text>
        <View style={styles.meta}>
          <View style={styles.categoryBadge}>
            <Text variant="caption">{item.category}</Text>
          </View>
          {item.authorLabel ? (
            <Text variant="caption">{item.authorLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Time + status */}
      <View style={styles.right}>
        <Text variant="caption">
          {t(`items.age.${item.age.unit}`, { count: item.age.count })}
        </Text>
        <Text
          style={{ color: statusColors[item.status] }}
          variant="caption"
        >
          {t(`items.status.${item.status}`)}
        </Text>
      </View>
    </View>
  )
}
