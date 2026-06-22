import { colors } from '@app/tokens'
import { Text, View } from 'react-native'

import type { IItemViewModel } from '@/features/items/models/Item.type'
import { GLASS, TEXT } from '@/helpers/style.constant'

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
  const statusColor =
    item.status === 'active'
      ? colors.success
      : item.status === 'draft'
        ? colors.warning
        : colors.text.tertiary

  return (
    <View
      style={[
        {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 12
        },
        !isLast && GLASS.divider
      ]}
    >
      {/* Author avatar */}
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#241A12',
          borderRadius: 18,
          flexShrink: 0,
          height: 36,
          justifyContent: 'center',
          width: 36
        }}
      >
        <Text
          style={[
            TEXT.label,
            { color: colors.accent, fontSize: 12, fontWeight: '700' }
          ]}
        >
          {item.authorInitials}
        </Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={TEXT.body}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[TEXT.caption, { marginTop: 2 }]}>
          {item.description}
        </Text>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: 8,
            marginTop: 4
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 9999,
              paddingHorizontal: 8,
              paddingVertical: 2
            }}
          >
            <Text style={TEXT.caption}>{item.category}</Text>
          </View>
          {item.authorLabel ? (
            <Text style={TEXT.caption}>{item.authorLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Time + status */}
      <View
        style={{
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 4,
          paddingTop: 2
        }}
      >
        <Text style={TEXT.caption}>{item.timeDisplay}</Text>
        <Text style={[TEXT.caption, { color: statusColor }]}>
          {item.status}
        </Text>
      </View>
    </View>
  )
}
