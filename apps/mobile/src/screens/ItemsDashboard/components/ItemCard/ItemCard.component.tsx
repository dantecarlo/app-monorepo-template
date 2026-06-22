import { Text, View } from 'react-native'

import { GLASS, TEXT } from '@/helpers/style.constant'
import {
  ITEM_CARD,
  STATUS_COLOR
} from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.styles'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IItemCardProps {
  isLast?: boolean
  item: IItemViewModel
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ItemCard = ({ isLast = false, item }: IItemCardProps) => {
  return (
    <View style={[ITEM_CARD.row, !isLast && GLASS.divider]}>
      {/* Author avatar */}
      <View style={ITEM_CARD.avatar}>
        <Text style={[TEXT.label, ITEM_CARD.avatarText]}>
          {item.authorInitials}
        </Text>
      </View>

      {/* Main content */}
      <View style={ITEM_CARD.middle}>
        <Text numberOfLines={1} style={TEXT.body}>
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[TEXT.caption, ITEM_CARD.description]}
        >
          {item.description}
        </Text>
        <View style={ITEM_CARD.meta}>
          <View style={ITEM_CARD.categoryBadge}>
            <Text style={TEXT.caption}>{item.category}</Text>
          </View>
          {item.authorLabel ? (
            <Text style={TEXT.caption}>{item.authorLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Time + status */}
      <View style={ITEM_CARD.right}>
        <Text style={TEXT.caption}>{item.timeDisplay}</Text>
        <Text style={[TEXT.caption, { color: STATUS_COLOR[item.status] }]}>
          {item.status}
        </Text>
      </View>
    </View>
  )
}
