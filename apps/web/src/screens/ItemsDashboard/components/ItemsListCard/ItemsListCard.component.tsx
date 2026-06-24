'use client'

import { useTranslations } from 'next-intl'

import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { SearchBar } from '@/components/ui/SearchBar'
import { GLASS, TEXT } from '@/helpers/style.constant'
import { ItemCard } from '@/screens/ItemsDashboard/components/ItemCard'
import {
  ITEMS_LIST_CARD,
  SKELETON_ROW_COUNT
} from '@/screens/ItemsDashboard/components/ItemsListCard/ItemsListCard.styles'
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
  const t = useTranslations('items.dashboard')

  return (
    <GlassCard padding="none">
      <div className={`flex flex-col gap-3 ${GLASS.CARD_PADDING}`}>
        <div className={ITEMS_LIST_CARD.HEADER}>
          <span className={TEXT.TITLE}>{t('listTitle')}</span>
          <span className={ITEMS_LIST_CARD.COUNT_LABEL}>
            {isLoading ? '…' : t('listResults', { count: items.length })}
          </span>
        </div>
        <SearchBar
          accessibilityLabel={t('searchLabel')}
          onChangeText={onSearchChange}
          placeholder={t('searchPlaceholder')}
          value={search}
        />
      </div>

      <div className={`px-5 pb-2 ${isLoading ? 'animate-pulse' : ''}`}>
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
        ) : items.length === 0 ? (
          <EmptyState message={t('listEmpty')} />
        ) : (
          items.map((item) => <ItemCard item={item} key={item.id} />)
        )}
      </div>
    </GlassCard>
  )
}
