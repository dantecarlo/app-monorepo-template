'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { GlassCard } from '@/components/ui/GlassCard'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { SearchBar } from '@/components/ui/SearchBar'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard'
import {
  ITEMS_LIST_CARD,
  SKELETON_ROW_COUNT
} from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.style'
import type { IItemsListCardProps } from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.type'

export const ItemsListCard = ({
  isError = false,
  isLoading,
  items = [],
  onRetry,
  onSearchChange,
  search
}: IItemsListCardProps) => {
  const { t } = useAppTranslator()

  return (
    <GlassCard padding="none">
      <div className={ITEMS_LIST_CARD.TOP}>
        <div className={ITEMS_LIST_CARD.HEADER}>
          <Text variant="title">{t('items.dashboard.listTitle')}</Text>
          {!isError && (
            <span className={ITEMS_LIST_CARD.COUNT_LABEL}>
              {isLoading
                ? '…'
                : t('items.dashboard.listResults', {
                    count: items.length
                  })}
            </span>
          )}
        </div>
        <SearchBar
          accessibilityLabel={t('items.dashboard.searchLabel')}
          onChangeText={onSearchChange}
          placeholder={t('items.dashboard.searchPlaceholder')}
          value={search}
        />
      </div>

      <div className={ITEMS_LIST_CARD.LIST_BODY}>
        {isLoading ? (
          Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <div className={ITEMS_LIST_CARD.SKELETON_ROW} key={i}>
              <LoadingSkeleton height={36} rounded="full" width={36} />
              <div className={ITEMS_LIST_CARD.SKELETON_LINES}>
                <LoadingSkeleton height={14} width={160} />
                <LoadingSkeleton height={12} width={96} />
              </div>
              <LoadingSkeleton height={16} width={48} />
            </div>
          ))
        ) : isError ? (
          <ErrorState onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState message={t('items.dashboard.listEmpty')} />
        ) : (
          items.map((item) => <ItemCard item={item} key={item.id} />)
        )}
      </div>
    </GlassCard>
  )
}
