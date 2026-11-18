import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { STATUS_CLASS } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.constant'
import { ITEM_CARD } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.style'
import type { IItemCardProps } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.type'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ItemCard = ({ item }: IItemCardProps) => {
  const { t } = useAppTranslator()

  return (
    <div className={`${ITEM_CARD.ROW} ${ITEM_CARD.DIVIDER}`}>
      {/* Author avatar */}
      <div aria-hidden="true" className={ITEM_CARD.AVATAR}>
        {item.authorInitials}
      </div>

      {/* Main content */}
      <div className={ITEM_CARD.MIDDLE}>
        <p className={ITEM_CARD.TITLE}>{item.title}</p>
        <p className={ITEM_CARD.DESCRIPTION}>{item.description}</p>
        <div className={ITEM_CARD.META}>
          <span className={ITEM_CARD.CATEGORY_BADGE}>{item.category}</span>
          {item.authorLabel !== undefined && (
            <span className={ITEM_CARD.META_TEXT}>{item.authorLabel}</span>
          )}
        </div>
      </div>

      {/* Time + status */}
      <div className={ITEM_CARD.RIGHT}>
        <span className={ITEM_CARD.TIME}>
          {t(`items.age.${item.age.unit}`, { count: item.age.count })}
        </span>
        <span className={STATUS_CLASS[item.status]}>
          {t(`items.status.${item.status}`)}
        </span>
      </div>
    </div>
  )
}
