import { Suspense } from 'react'

import { LAYOUT } from '@/helpers/style.constant'
import { ItemsDashboardScreen } from '@/screens/ItemsDashboard'
import { ItemsSummaryScreen } from '@/screens/ItemsSummary'

const HomePage = () => (
  <main className={`${LAYOUT.MAX_WIDTH} ${LAYOUT.SCREEN_PADDING}`}>
    <Suspense>
      <ItemsSummaryScreen />
    </Suspense>
    <ItemsDashboardScreen />
  </main>
)

export default HomePage
