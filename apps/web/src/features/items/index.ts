// Items feature barrel — export only what other features should consume.
// Keep implementation details (services, adapter internals) internal.
export { ItemCard } from '@/features/items/components/ItemCard.component'
export { useItems } from '@/features/items/hooks/useItems.hook'
export type {
  IItemDto,
  IItemsDashboardSummary,
  IItemViewModel
} from '@/features/items/models/Item.type'
export { ItemsDashboard } from '@/features/items/screens/ItemsDashboard.screen'
