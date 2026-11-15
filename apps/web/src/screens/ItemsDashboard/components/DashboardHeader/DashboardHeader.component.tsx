'use client'

import { useTranslations } from 'next-intl'

import { IconButton } from '@/components/ui/IconButton'
import { Text } from '@/components/ui/Text'
import { DASHBOARD_HEADER } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.style'

export const DashboardHeader = () => {
  const t = useTranslations('items.dashboard')
  const tApp = useTranslations('app')
  const appName = tApp('name')

  return (
    <header className={DASHBOARD_HEADER.ROOT}>
      <div className={DASHBOARD_HEADER.WORDMARK}>
        <div aria-label={appName} className={DASHBOARD_HEADER.APP_BADGE}>
          {appName.charAt(0)}
        </div>
        <div>
          <p className={DASHBOARD_HEADER.SUBTITLE}>{t('welcomeBack')}</p>
          <Text as="p" variant="title">
            {t('title')}
          </Text>
        </div>
      </div>
      <IconButton
        accessibilityLabel={t('settingsLabel')}
        name="settings"
      />
    </header>
  )
}
