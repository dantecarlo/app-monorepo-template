import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '@/test/mocks/server'

// MSW server lifecycle — fail loudly on any unmocked request so HTTP is
// always explicitly handled in a test.
//
// NOTE: React Native component/hook render tests are not wired under vitest
// yet (RN-under-vitest needs react-native-web + RN preset, and pulls a
// react-test-renderer that conflicts with this app's React version). The
// config is intentionally happy-dom + .tsx-collectable so that infra can be
// added later without changing the glob. Until then, mobile tests cover pure
// logic (adapters, services). See scripts/verify-tests.mjs for the documented
// exemptions.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
