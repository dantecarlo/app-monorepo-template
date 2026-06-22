// Items feature barrel — export only what other features should consume.
// Keep implementation details (services, adapter internals) internal.
export type {
  ItemDto,
  ItemViewModel,
  ItemsDashboardSummary,
} from '@/features/items/models/Item.type';
export { useItems } from '@/features/items/hooks/useItems.hook';
export { ItemsDashboard } from '@/features/items/screens/ItemsDashboard.screen';
export { ItemCard } from '@/features/items/components/ItemCard.component';
