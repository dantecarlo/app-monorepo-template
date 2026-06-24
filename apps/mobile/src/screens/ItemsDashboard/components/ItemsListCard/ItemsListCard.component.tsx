import { colors } from '@app/tokens'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Text, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { TEXT } from '@/helpers/style.constant'
import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard'
import { ITEMS_LIST_CARD_STYLES as styles } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.styles'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

export interface IItemsListCardProps {
  isLoading: boolean
  items: IItemViewModel[]
  onSearchChange: (v: string) => void
  search: string
}

export const ItemsListCard = ({
  isLoading,
  items = [],
  onSearchChange,
  search
}: IItemsListCardProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'items.dashboard'
  })

  return (
    <GlassCard padding="none" radius="xl">
      <View style={[{ padding: 20 }, styles.cardHeader]}>
        <View style={styles.cardHeaderRow}>
          <Text style={TEXT.title}>{t('listTitle')}</Text>
          <Text style={TEXT.caption}>
            {isLoading
              ? '…'
              : `${items.length} ${t('listResults', { count: items.length })}`}
          </Text>
        </View>
        <SearchBar
          accessibilityLabel={t('searchLabel')}
          onChangeText={onSearchChange}
          placeholder={t('searchPlaceholder')}
          value={search}
        />
      </View>

      <View style={styles.listContent}>
        {isLoading ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.loadingIndicator}
          />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item, index) => (
            <ItemCard
              isLast={index === items.length - 1}
              item={item}
              key={item.id}
            />
          ))
        )}
      </View>
    </GlassCard>
  )
}
