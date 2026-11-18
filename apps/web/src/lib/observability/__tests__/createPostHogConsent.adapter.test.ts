import { afterEach, expect, test, vi } from 'vitest'

// The SDK is replaced at its module, afresh for each registry: loadSdk
// records every time the app loads that module.
const sdk = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn()
}))

const { loadSdk } = vi.hoisted(() => ({ loadSdk: vi.fn() }))

const KEY = 'phc_contract_key'
const GRANT_RECORD_KEY = 'posthog-consent:granted'

const CONSENT_CALLS = [
  sdk.opt_in_capturing,
  sdk.opt_out_capturing,
  sdk.reset
]

// The client reads the environment when its module loads, so each adapter
// comes from a fresh module registry under its own environment, with the
// observability adapter of that registry.
const loadConsent = async ({
  consent,
  key
}: {
  consent?: string
  key?: string
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  loadSdk.mockClear()
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  vi.doMock('posthog-js', () => {
    loadSdk()
    return { default: sdk }
  })
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  const { createPostHogObservability } =
    await import('@/lib/observability/createPostHogObservability.adapter')
  return {
    adapter: createPostHogConsent(),
    observability: createPostHogObservability()
  }
}

// Grants, revokes and reads the status once, as a banner would.
const exercise = async ({
  adapter
}: Pick<Awaited<ReturnType<typeof loadConsent>>, 'adapter'>) => {
  await adapter.grant()
  await adapter.revoke()
  return adapter.getStatus()
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  localStorage.clear()
})

test('reads pending and loads nothing before a choice in opt-in mode', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })

  expect(loadSdk).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('pending')
  expect(sdk.opt_in_capturing).not.toHaveBeenCalled()
  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBeNull()
})

test('grant loads PostHog once, opts it in without an opt-in event and reads granted', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  expect(loadSdk).not.toHaveBeenCalled()

  await adapter.grant()
  await adapter.grant()

  expect(loadSdk).toHaveBeenCalledOnce()
  expect(sdk.init).toHaveBeenCalledOnce()
  expect(sdk.opt_in_capturing).toHaveBeenCalledWith({
    captureEventName: false
  })
  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBe('true')
  expect(await adapter.getStatus()).toBe('granted')
})

test('reads granted after a grant from an earlier visit', async () => {
  localStorage.setItem(GRANT_RECORD_KEY, 'true')
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })

  expect(await adapter.getStatus()).toBe('granted')
})

test('revoke opts PostHog out, resets it with a new device id, stops it and reads denied', async () => {
  const { adapter, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()

  await adapter.revoke()
  observability.captureError({ error: new Error('after the revoke') })

  expect(sdk.opt_out_capturing).toHaveBeenCalledOnce()
  expect(sdk.reset).toHaveBeenCalledExactlyOnceWith({
    resetDeviceID: true
  })
  expect(sdk.opt_out_capturing.mock.invocationCallOrder[0]).toBeLessThan(
    sdk.reset.mock.invocationCallOrder[0] ?? 0
  )
  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBeNull()
  expect(sdk.captureException).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('denied')
})

test('grants again after a revoke with the SDK it already loaded', async () => {
  const { adapter, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()
  await adapter.revoke()

  await adapter.grant()
  observability.captureError({
    error: new Error('after the second grant')
  })

  expect(sdk.opt_in_capturing).toHaveBeenCalledTimes(2)
  expect(loadSdk).toHaveBeenCalledOnce()
  expect(sdk.init).toHaveBeenCalledOnce()
  expect(sdk.captureException).toHaveBeenCalledOnce()
  expect(await adapter.getStatus()).toBe('granted')
})

test('keeps a grant made while a revoke waits for the load', async () => {
  localStorage.setItem(GRANT_RECORD_KEY, 'true')
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })

  const revoked = adapter.revoke()
  const granted = adapter.grant()
  await Promise.all([revoked, granted])

  expect(sdk.opt_out_capturing).not.toHaveBeenCalled()
  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBe('true')
  expect(await adapter.getStatus()).toBe('granted')
})

test('changes nothing and reads not-required outside opt-in mode', async () => {
  for (const consent of ['granted', 'memory']) {
    const { adapter } = await loadConsent({ consent, key: KEY })

    expect(await exercise({ adapter })).toBe('not-required')
    CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
  }
})

test('changes nothing and reads not-required without a key', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in' })

  expect(await exercise({ adapter })).toBe('not-required')
  expect(loadSdk).not.toHaveBeenCalled()
  CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})

test('changes nothing and reads not-required on the server', async () => {
  vi.stubGlobal('window', undefined)
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })

  expect(await exercise({ adapter })).toBe('not-required')
  expect(loadSdk).not.toHaveBeenCalled()
  CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})
