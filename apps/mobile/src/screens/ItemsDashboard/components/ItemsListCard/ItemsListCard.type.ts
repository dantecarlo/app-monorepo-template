import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

export interface IItemsListCardProps {
  isError?: boolean
  isLoading: boolean
  items: IItemViewModel[]
  onRetry?: () => void
  onSearchChange: (v: string) => void
  search: string
}
