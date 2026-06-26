'use client'

import { useTranslations } from 'next-intl'

import { IconButton } from '@/components/ui/IconButton'
import { TEXT } from '@/helpers/style.constant'
import { DASHBOARD_HEADER } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.styles'

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
          <p className={TEXT.TITLE}>{t('title')}</p>
        </div>
      </div>
      <IconButton
        accessibilityLabel={t('settingsLabel')}
        name="settings"
      />
    </header>
  )
}
