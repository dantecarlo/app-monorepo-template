'use client'

import { useTranslations } from 'next-intl'

import { IconButton } from '@/components/ui/IconButton'
import { TEXT } from '@/helpers/style.constant'
import { DASHBOARD_HEADER } from '@/screens/ItemsDashboard/components/DashboardHeader/DashboardHeader.styles'

export const DashboardHeader = () => {
  const t = useTranslations('items.dashboard')

  return (
    <header className={DASHBOARD_HEADER.ROOT}>
      <div className={DASHBOARD_HEADER.WORDMARK}>
        <div
          aria-label={t('appLabel')}
          className={DASHBOARD_HEADER.APP_BADGE}
        >
          A
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
