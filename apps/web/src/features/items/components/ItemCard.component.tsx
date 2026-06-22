import type { ItemViewModel } from '@/features/items/models/Item.type';
import { ITEM_CARD } from '@/features/items/components/ItemCard.styles';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ItemViewModel['status'], string> = {
  active: 'active',
  archived: 'archived',
  draft: 'draft',
};

const STATUS_CLASS: Record<ItemViewModel['status'], string> = {
  active: ITEM_CARD.STATUS_ACTIVE,
  archived: ITEM_CARD.STATUS_ARCHIVED,
  draft: ITEM_CARD.STATUS_DRAFT,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ItemCardProps {
  item: ItemViewModel;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ItemCard({ item }: ItemCardProps) {
  return (
    <div className={`${ITEM_CARD.ROW} ${ITEM_CARD.DIVIDER}`}>
      {/* Author avatar */}
      <div className={ITEM_CARD.AVATAR} aria-hidden="true">
        {item.authorInitials}
      </div>

      {/* Main content */}
      <div className={ITEM_CARD.MIDDLE}>
        <p className={ITEM_CARD.TITLE}>{item.title}</p>
        <p className={ITEM_CARD.DESCRIPTION}>{item.description}</p>
        <div className={ITEM_CARD.META}>
          <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-caption text-text-tertiary">
            {item.category}
          </span>
          {item.authorLabel && (
            <span className={ITEM_CARD.META_TEXT}>{item.authorLabel}</span>
          )}
        </div>
      </div>

      {/* Time + status */}
      <div className={ITEM_CARD.RIGHT}>
        <span className={ITEM_CARD.TIME}>{item.timeDisplay}</span>
        <span className={STATUS_CLASS[item.status]}>{STATUS_LABEL[item.status]}</span>
      </div>
    </div>
  );
}
