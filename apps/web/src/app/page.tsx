import { Suspense } from 'react'

import { ItemsDashboardScreen } from '@/screens/ItemsDashboard'
import { ItemsSummaryScreen } from '@/screens/ItemsSummary'

/**
 * Root page — renders the items summary (cached Server Component) followed by
 * the interactive dashboard (client island).
 *
 * ItemsSummaryScreen is wrapped in <Suspense> so:
 *  - The streaming HTML shell is sent immediately.
 *  - The cached server fetch (via 'use cache' + cacheLife/cacheTag) resolves
 *    and streams the summary card without blocking the client island.
 *
 * This is the cacheComponents PPR pattern: cached Server Component above the
 * interactive client island. See services/ItemsSummary for the service layer.
 */
const HomePage = () => (
  <>
    <Suspense>
      <ItemsSummaryScreen />
    </Suspense>
    <ItemsDashboardScreen />
  </>
)

export default HomePage
