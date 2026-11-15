import { View } from 'react-native'

import { Text } from '@/components/ui/Text'
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
  return (
    <View style={[ITEM_CARD.row, !isLast && ITEM_CARD.divider]}>
      {/* Author avatar */}
      <View style={ITEM_CARD.avatar}>
        <Text style={ITEM_CARD.avatarText} variant="label">
          {item.authorInitials}
        </Text>
      </View>

      {/* Main content */}
      <View style={ITEM_CARD.middle}>
        <Text numberOfLines={1} variant="body">
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          style={ITEM_CARD.description}
          variant="caption"
        >
          {item.description}
        </Text>
        <View style={ITEM_CARD.meta}>
          <View style={ITEM_CARD.categoryBadge}>
            <Text variant="caption">{item.category}</Text>
          </View>
          {item.authorLabel ? (
            <Text variant="caption">{item.authorLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Time + status */}
      <View style={ITEM_CARD.right}>
        <Text variant="caption">{item.timeDisplay}</Text>
        <Text
          style={{ color: STATUS_COLOR[item.status] }}
          variant="caption"
        >
          {item.status}
        </Text>
      </View>
    </View>
  )
}
