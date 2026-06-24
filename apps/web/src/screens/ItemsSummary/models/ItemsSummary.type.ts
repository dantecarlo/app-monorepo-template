// Re-export the view model from the service layer so screen-local imports use
// the screen's own models path (fractal convention). The canonical definition
// lives in the service; this file is the screen-local alias.
export type { IItemsSummaryViewModel } from '@/services/ItemsSummary/itemsSummary.type'
