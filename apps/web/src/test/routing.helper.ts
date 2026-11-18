import { vi } from 'vitest'

import type { IAppRouter } from '@/lib/routing'

export interface ICreateRoutingDoubleParams {
  /** The spies a test asserts on; every method left out is a fresh spy. */
  router?: Partial<IAppRouter>
}

/**
 * The module a test hands to vi.mock('@/lib/routing'): its useAppRouter
 * returns a router whose methods are the given spies, and a spy for each
 * method left out.
 *
 *   vi.mock('@/lib/routing', async () =>
 *     (await import('@/test/routing.helper')).createRoutingDouble({
 *       router: { refresh }
 *     })
 *   )
 */
export const createRoutingDouble = ({
  router = {}
}: ICreateRoutingDoubleParams = {}) => ({
  useAppRouter: (): IAppRouter => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    ...router
  })
})
