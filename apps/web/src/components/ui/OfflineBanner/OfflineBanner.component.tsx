'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { offlineBannerVariants } from '@/components/ui/OfflineBanner/OfflineBanner.styles'
import { useOnlineStatus } from '@/components/ui/OfflineBanner/useOnlineStatus.hook'

export interface IOfflineBannerProps {
  forceOffline?: boolean
}

export const OfflineBanner = ({
  forceOffline
}: IOfflineBannerProps): JSX.Element | null => {
  const t = useTranslations('helper.offline')
  const isOnline = useOnlineStatus()
  const isOffline = forceOffline ?? !isOnline

  if (!isOffline) {
    return null
  }

  return (
    <div className={offlineBannerVariants()} role="status">
      {t('message')}
    </div>
  )
}
