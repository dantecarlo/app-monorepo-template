import { setupServer } from 'msw/node'

import { handlers } from '@/test/mocks/handlers'

// Shared MSW server for the mobile test suite. Override per-test with
// server.use(...); handlers reset after each test (see src/test/setup.ts).
export const server = setupServer(...handlers)
