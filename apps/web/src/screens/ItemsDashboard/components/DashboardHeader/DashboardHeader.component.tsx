'use client'

import { IconButton } from '@/components/ui/IconButton'
import { Text } from '@/components/ui/Text'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { DASHBOARD_HEADER } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.style'

export const DashboardHeader = () => {
  const { t } = useAppTranslator()
  const appName = t('app.name')

  return (
    <header className={DASHBOARD_HEADER.ROOT}>
      <div className={DASHBOARD_HEADER.WORDMARK}>
        <div aria-label={appName} className={DASHBOARD_HEADER.APP_BADGE}>
          {appName.charAt(0)}
        </div>
        <div>
          <p className={DASHBOARD_HEADER.SUBTITLE}>
            {t('items.dashboard.welcomeBack')}
          </p>
          <Text as="p" variant="title">
            {t('items.dashboard.title')}
          </Text>
        </div>
      </div>
      <IconButton
        accessibilityLabel={t('items.dashboard.settingsLabel')}
        name="settings"
      />
    </header>
  )
}
