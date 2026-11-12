import { ITEM_CARD } from '@/screens/ItemsDashboard/components/ItemCard/ItemCard.styles'
import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

export const STATUS_LABEL: Record<IItemViewModel['status'], string> = {
  active: 'active',
  archived: 'archived',
  draft: 'draft'
}

export const STATUS_CLASS: Record<IItemViewModel['status'], string> = {
  active: ITEM_CARD.STATUS_ACTIVE,
  archived: ITEM_CARD.STATUS_ARCHIVED,
  draft: ITEM_CARD.STATUS_DRAFT
}
