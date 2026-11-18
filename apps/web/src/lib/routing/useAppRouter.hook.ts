'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import type { IAppRouter } from '@/lib/routing/appRouter.type'

/**
 * The app's router over Next's: push, replace and refresh, and nothing else
 * of it. It returns the same object while Next's router is the same, so a
 * callback that depends on it stays stable.
 */
export const useAppRouter = (): IAppRouter => {
  const router = useRouter()

  return useMemo<IAppRouter>(
    () => ({
      push: (href) => router.push(href),
      refresh: () => router.refresh(),
      replace: (href) => router.replace(href)
    }),
    [router]
  )
}
