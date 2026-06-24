import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '@/test/mocks/server'

// MSW server lifecycle — fail loudly on any unmocked request so HTTP is
// always explicitly handled in a test.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
