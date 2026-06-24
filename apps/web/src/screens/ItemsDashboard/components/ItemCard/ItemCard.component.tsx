import { ITEM_CARD } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.styles'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<IItemViewModel['status'], string> = {
  active: 'active',
  archived: 'archived',
  draft: 'draft'
}

const STATUS_CLASS: Record<IItemViewModel['status'], string> = {
  active: ITEM_CARD.STATUS_ACTIVE,
  archived: ITEM_CARD.STATUS_ARCHIVED,
  draft: ITEM_CARD.STATUS_DRAFT
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IItemCardProps {
  item: IItemViewModel
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ItemCard = ({ item }: IItemCardProps) => {
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
          {item.authorLabel && (
            <span className={ITEM_CARD.META_TEXT}>{item.authorLabel}</span>
          )}
        </div>
      </div>

      {/* Time + status */}
      <div className={ITEM_CARD.RIGHT}>
        <span className={ITEM_CARD.TIME}>{item.timeDisplay}</span>
        <span className={STATUS_CLASS[item.status]}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
    </div>
  )
}
