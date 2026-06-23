import '@testing-library/jest-dom/vitest'

import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

import { server } from '@/test/mocks/server'

// Register the vitest-axe matchers (e.g. toHaveNoViolations) on expect().
expect.extend(matchers)

// MSW server lifecycle — fail loudly on any unmocked request so HTTP is
// always explicitly handled in a test.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
