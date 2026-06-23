import { setupServer } from 'msw/node'

import { handlers } from '@/test/mocks/handlers'

// Shared MSW server for the test suite. Default handlers live in handlers.ts;
// override per-test with server.use(...) and they reset after each test
// (see src/test/setup.ts).
export const server = setupServer(...handlers)
