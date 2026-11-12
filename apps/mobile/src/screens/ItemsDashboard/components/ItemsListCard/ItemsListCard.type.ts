import type { IItemViewModel } from '@/screens/ItemsDashboard/models/Item.type'

export interface IItemsListCardProps {
  isLoading: boolean
  items: IItemViewModel[]
  onSearchChange: (v: string) => void
  search: string
}
