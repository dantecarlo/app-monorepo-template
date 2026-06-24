import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import type { IItemsSummaryViewModel } from '@/services/ItemsSummary/itemsSummary.type'

// ---------------------------------------------------------------------------
// Adapter — maps IItemDto[] → IItemsSummaryViewModel
// ---------------------------------------------------------------------------

export const adaptItemsSummary = (
  dtos: IItemDto[]
): IItemsSummaryViewModel => ({
  activeCount: dtos.filter((d) => d.status === 'active').length,
  archivedCount: dtos.filter((d) => d.status === 'archived').length,
  draftCount: dtos.filter((d) => d.status === 'draft').length,
  totalCount: dtos.length
})
