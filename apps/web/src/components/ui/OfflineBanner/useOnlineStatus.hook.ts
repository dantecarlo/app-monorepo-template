'use client'

import { useEffect, useState } from 'react'

import {
  OFFLINE_EVENT,
  ONLINE_EVENT
} from '@/components/ui/OfflineBanner/OfflineBanner.constant'

export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const update = (): void => setIsOnline(navigator.onLine)

    update()
    window.addEventListener(ONLINE_EVENT, update)
    window.addEventListener(OFFLINE_EVENT, update)

    return () => {
      window.removeEventListener(ONLINE_EVENT, update)
      window.removeEventListener(OFFLINE_EVENT, update)
    }
  }, [])

  return isOnline
}
