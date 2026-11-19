import {
  type IObservabilityPortHarness,
  runObservabilityPortContract
} from '@app/tooling/observability-port-contract'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()
const setUser = vi.fn()
const addBreadcrumb = vi.fn()
const init = vi.fn()

vi.mock('@sentry/react-native', () => ({
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  init: (...args: unknown[]) => init(...args),
  setUser: (...args: unknown[]) => setUser(...args)
}))

const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN

const loadAdapter = async () => {
  const module =
    await import('@/lib/observability/createSentryObservability.adapter')
  return module.createSentryObservability()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.stubEnv('EXPO_PUBLIC_SENTRY_DSN', 'https://example@sentry.io/2')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// The file leaves the DSN variable as the run found it, set or unset.
afterAll(() => {
  expect(process.env.EXPO_PUBLIC_SENTRY_DSN).toBe(originalDsn)
  expect('EXPO_PUBLIC_SENTRY_DSN' in process.env).toBe(
    originalDsn !== undefined
  )
})

test('captureError scrubs PII from the context', async () => {
  const adapter = await loadAdapter()
  adapter.captureError({
    context: { email: 'user@example.com', screen: 'Home' },
    error: new Error('boom')
  })
  const [, options] = captureException.mock.calls[0]
  expect(options.extra.email).toBe('[redacted]')
  expect(options.extra.screen).toBe('Home')
})

test('setUser scrubs PII from the user payload', async () => {
  const adapter = await loadAdapter()
  adapter.setUser?.({ user: { email: 'user@example.com', id: 'u1' } })
  const [payload] = setUser.mock.calls[0]
  expect(payload.email).toBe('[redacted]')
  expect(payload.id).toBe('u1')
})

test('Sentry.init registers beforeSend that scrubs auto-captured events', async () => {
  await loadAdapter()
  const [config] = init.mock.calls[0]
  const scrubbed = config.beforeSend({
    request: {
      headers: {
        Authorization: 'Bearer leaked',
        Cookie: 'sb-access-token=x'
      }
    }
  })
  expect(scrubbed.request.headers.Authorization).toBe('[redacted]')
  expect(scrubbed.request.headers.Cookie).toBe('[redacted]')
})

test('Sentry.init registers beforeBreadcrumb that scrubs auto-captured breadcrumbs', async () => {
  await loadAdapter()
  const [config] = init.mock.calls[0]
  const scrubbed = config.beforeBreadcrumb({
    data: { email: 'user@example.com', screen: 'Home' }
  })
  expect(scrubbed.data.email).toBe('[redacted]')
  expect(scrubbed.data.screen).toBe('Home')
})

test('methods no-op when the DSN is absent', async () => {
  vi.resetModules()
  vi.stubEnv('EXPO_PUBLIC_SENTRY_DSN', undefined)
  const adapter = await loadAdapter()
  adapter.captureError({ error: new Error('x') })
  adapter.setUser?.({ user: { id: 'u1' } })
  expect(captureException).not.toHaveBeenCalled()
  expect(setUser).not.toHaveBeenCalled()
})

// What reached Sentry: every SDK call but the init, and the user of the last
// setUser. The adapter reads the DSN when its module loads.
const sentryHarness: IObservabilityPortHarness = {
  create: async ({ enabled }) => {
    vi.clearAllMocks()
    vi.resetModules()
    if (enabled) {
      vi.stubEnv('EXPO_PUBLIC_SENTRY_DSN', 'https://example@sentry.io/2')
    } else {
      vi.stubEnv('EXPO_PUBLIC_SENTRY_DSN', undefined)
    }
    return loadAdapter()
  },
  currentUser: () =>
    (setUser.mock.calls.at(-1)?.[0] ?? null) as { id?: unknown } | null,
  delivered: () =>
    [captureException, captureMessage, addBreadcrumb, setUser].flatMap(
      (mock) => mock.mock.calls
    ),
  delivers: true
}

describe('the observability port contract', () => {
  runObservabilityPortContract({ harness: sentryHarness, test })
})
