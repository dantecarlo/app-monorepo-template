import { View, Text } from 'react-native';
import type { ItemViewModel } from '@/features/items/models/Item.type';
import { TEXT, GLASS } from '@/helpers/style.constant';
import { colors } from '@app/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ItemCardProps {
  item: ItemViewModel;
  isLast?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItemCard({ item, isLast = false }: ItemCardProps) {
  const statusColor =
    item.status === 'active'
      ? colors.success
      : item.status === 'draft'
      ? colors.warning
      : colors.text.tertiary;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingVertical: 12,
        },
        !isLast && GLASS.divider,
      ]}
    >
      {/* Author avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#241A12',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text
          style={[TEXT.label, { color: colors.accent, fontSize: 12, fontWeight: '700' }]}
        >
          {item.authorInitials}
        </Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={TEXT.body} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[TEXT.caption, { marginTop: 2 }]} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 9999,
              paddingHorizontal: 8,
              paddingVertical: 2,
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
      <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0, paddingTop: 2 }}>
        <Text style={TEXT.caption}>{item.timeDisplay}</Text>
        <Text style={[TEXT.caption, { color: statusColor }]}>{item.status}</Text>
      </View>
    </View>
  );
}
