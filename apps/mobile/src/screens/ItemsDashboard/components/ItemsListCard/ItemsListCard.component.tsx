import { colors } from '@app/tokens'
import { ActivityIndicator, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard'
import { ITEMS_LIST_CARD_STYLES } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.style'
import type { IItemsListCardProps } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.type'

export const ItemsListCard = ({
  isError = false,
  isLoading,
  items = [],
  onRetry,
  onSearchChange,
  search
}: IItemsListCardProps) => {
  const styles = useThemedStyles({ styles: ITEMS_LIST_CARD_STYLES })

  const { t } = useAppTranslator()

  return (
    <GlassCard padding="none" radius="xl">
      <View style={[{ padding: 20 }, styles.cardHeader]}>
        <View style={styles.cardHeaderRow}>
          <Text variant="title">{t('items.dashboard.listTitle')}</Text>
          {!isError && (
            <Text variant="caption">
              {isLoading
                ? '…'
                : t('items.dashboard.listResults', {
                    count: items.length
                  })}
            </Text>
          )}
        </View>
        <SearchBar
          accessibilityLabel={t('items.dashboard.searchLabel')}
          onChangeText={onSearchChange}
          placeholder={t('items.dashboard.searchPlaceholder')}
          value={search}
        />
      </View>

      <View style={styles.listContent}>
        {isLoading ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.loadingIndicator}
          />
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
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
