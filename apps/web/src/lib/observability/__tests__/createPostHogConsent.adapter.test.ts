import { afterEach, expect, test, vi } from 'vitest'

// The SDK is replaced at its module, afresh for each registry: loadSdk
// records every time the app loads that module.
const sdk = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reloadFeatureFlags: vi.fn(),
  reset: vi.fn(),
  set_config: vi.fn()
}))

const { loadSdk } = vi.hoisted(() => ({ loadSdk: vi.fn() }))

const KEY = 'phc_contract_key'
const GRANT_RECORD_KEY = 'posthog-consent:granted'

const CONSENT_CALLS = [
  sdk.opt_in_capturing,
  sdk.opt_out_capturing,
  sdk.reloadFeatureFlags,
  sdk.reset,
  sdk.set_config
]

const FLAGS_PAUSED = { advanced_disable_flags: true }
const FLAGS_RESUMED = { advanced_disable_flags: false }

const orderOf = (mock: { mock: { invocationCallOrder: number[] } }) =>
  mock.mock.invocationCallOrder

// The client reads the environment when its module loads, so each adapter
// comes from a fresh module registry under its own environment, with the
// observability adapter of that registry.
const loadConsent = async ({
  consent,
  key,
  sdkLoaded
}: {
  consent?: string
  key?: string
  sdkLoaded?: Promise<void>
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  loadSdk.mockClear()
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  // A test that passes sdkLoaded holds the SDK's load until it settles.
  vi.doMock('posthog-js', async () => {
    await sdkLoaded
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
  vi.restoreAllMocks()
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
  // The flags stay as the SDK loads them.
  expect(sdk.set_config).not.toHaveBeenCalled()
  expect(sdk.reloadFeatureFlags).not.toHaveBeenCalled()
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

// The reset of posthog-js reloads the flags for the new anonymous id, one
// /flags request after the refusal, unless they are paused first.
test('a revoke pauses the flags before the reset, so it requests none', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  await adapter.grant()

  await adapter.revoke()

  expect(sdk.set_config).toHaveBeenCalledExactlyOnceWith(FLAGS_PAUSED)
  expect(orderOf(sdk.set_config)[0]).toBeLessThan(
    orderOf(sdk.reset)[0] ?? 0
  )
  expect(sdk.reloadFeatureFlags).not.toHaveBeenCalled()
})

test('drops every call made after a revoke while the SDK loads', async () => {
  localStorage.setItem(GRANT_RECORD_KEY, 'true')
  const gate: { open?: () => void } = {}
  const sdkLoaded = new Promise<void>((resolve) => {
    gate.open = resolve
  })
  const { adapter, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY,
    sdkLoaded
  })

  const revoked = adapter.revoke()
  observability.captureError({ error: new Error('after the revoke') })
  gate.open?.()
  await revoked

  expect(loadSdk).toHaveBeenCalledOnce()
  expect(sdk.captureException).not.toHaveBeenCalled()
  expect(sdk.opt_out_capturing).toHaveBeenCalledOnce()
  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBeNull()
  expect(await adapter.getStatus()).toBe('denied')
})

test('reads granted after a grant while the browser blocks site data', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new Error('SecurityError')
  })

  await adapter.grant()

  expect(sdk.opt_in_capturing).toHaveBeenCalledOnce()
  expect(await adapter.getStatus()).toBe('granted')
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

test('a grant after a revoke resumes the flags and reloads them once', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  await adapter.grant()
  await adapter.revoke()

  await adapter.grant()

  expect(sdk.set_config).toHaveBeenLastCalledWith(FLAGS_RESUMED)
  expect(sdk.set_config).toHaveBeenCalledTimes(2)
  expect(sdk.reloadFeatureFlags).toHaveBeenCalledOnce()
  expect(orderOf(sdk.opt_in_capturing)[1]).toBeLessThan(
    orderOf(sdk.set_config)[1] ?? 0
  )
  expect(orderOf(sdk.set_config)[1]).toBeLessThan(
    orderOf(sdk.reloadFeatureFlags)[0] ?? 0
  )
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
