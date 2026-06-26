import type { IItemsSummaryViewModel } from '@/screens/ItemsSummary/models/ItemsSummary.type'
import { getItemsSummary } from '@/services/ItemsSummary'

// ---------------------------------------------------------------------------
// Screen-local data loader for the ItemsSummary RSC.
//
// The screen is a React Server Component, so it cannot use a client hook. This
// loader is the server-side equivalent of the screen's data seam: it owns the
// async orchestration (calling the cached @/services/ItemsSummary domain
// service) so the screen body stays a pure await-and-render, never a naked
// service call wired straight into JSX (code-standards: logic-in-hook /
// Data Flow). Keeping it colocated mirrors the useItems hook pattern used by
// the client dashboard screen.
// ---------------------------------------------------------------------------

export const loadItemsSummary =
  async (): Promise<IItemsSummaryViewModel> => getItemsSummary()
