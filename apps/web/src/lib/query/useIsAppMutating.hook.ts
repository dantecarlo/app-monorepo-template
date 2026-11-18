'use client'

import { useIsMutating } from '@tanstack/react-query'

import type { IIsAppMutatingParams } from '@/lib/query/useIsAppMutating.type'

/**
 * Whether a mutation of exactly this key is running: a sign-out button, for
 * one, stays disabled while the sign-out it started is in flight.
 */
export const useIsAppMutating = ({
  mutationKey
}: IIsAppMutatingParams): boolean =>
  useIsMutating({ exact: true, mutationKey }) > 0
