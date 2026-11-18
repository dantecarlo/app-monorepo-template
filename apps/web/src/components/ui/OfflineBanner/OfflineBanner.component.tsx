'use client'

import type { JSX } from 'react'

import { offlineBannerVariants } from '@/components/ui/OfflineBanner/OfflineBanner.style'
import type { IOfflineBannerProps } from '@/components/ui/OfflineBanner/OfflineBanner.type'
import { useOnlineStatus } from '@/components/ui/OfflineBanner/useOnlineStatus.hook'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const OfflineBanner = ({
  forceOffline
}: IOfflineBannerProps): JSX.Element | null => {
  const { t } = useAppTranslator()
  const isOnline = useOnlineStatus()
  const isOffline = forceOffline ?? !isOnline

  if (!isOffline) {
    return null
  }

  return (
    <div className={offlineBannerVariants()} role="status">
      {t('helper.offline.message')}
    </div>
  )
}
