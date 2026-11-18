import { afterEach, expect, test, vi } from 'vitest'

// The SDK is replaced at its module. It keeps the explicit choice the way
// posthog-js does: an opt-in or opt-out records it, and a reset clears it.
const sdk = vi.hoisted(() => {
  const choice = { explicit: 'pending' }
  return {
    choice,
    get_explicit_consent_status: vi.fn(() => choice.explicit),
    init: vi.fn(),
    opt_in_capturing: vi.fn(() => {
      choice.explicit = 'granted'
    }),
    opt_out_capturing: vi.fn(() => {
      choice.explicit = 'denied'
    }),
    reset: vi.fn(() => {
      choice.explicit = 'pending'
    })
  }
})

vi.mock('posthog-js', () => ({ default: sdk }))

const KEY = 'phc_contract_key'

const CONSENT_CALLS = [
  sdk.get_explicit_consent_status,
  sdk.opt_in_capturing,
  sdk.opt_out_capturing,
  sdk.reset
]

// The client reads the environment when its module loads, so each adapter
// comes from a fresh module registry under its own environment.
const loadConsent = async ({
  consent,
  key
}: {
  consent?: string
  key?: string
}) => {
  sdk.choice.explicit = 'pending'
  Object.values(sdk)
    .filter((member) => vi.isMockFunction(member))
    .forEach((mock) => mock.mockClear())
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  return createPostHogConsent()
}

// Grants, revokes and reads the status once, as a banner would.
const exercise = async ({
  adapter
}: {
  adapter: Awaited<ReturnType<typeof loadConsent>>
}) => {
  await adapter.grant()
  await adapter.revoke()
  return adapter.getStatus()
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

test('reads pending and opts nothing in before a choice in opt-in mode', async () => {
  const adapter = await loadConsent({ consent: 'opt-in', key: KEY })

  expect(await adapter.getStatus()).toBe('pending')
  expect(sdk.opt_in_capturing).not.toHaveBeenCalled()
})

test('grant opts PostHog in without an opt-in event and reads granted', async () => {
  const adapter = await loadConsent({ consent: 'opt-in', key: KEY })

  await adapter.grant()

  expect(sdk.opt_in_capturing).toHaveBeenCalledExactlyOnceWith({
    captureEventName: false
  })
  expect(await adapter.getStatus()).toBe('granted')
})

test('revoke opts PostHog out, resets it with a new device id and reads denied', async () => {
  const adapter = await loadConsent({ consent: 'opt-in', key: KEY })
  await adapter.grant()

  await adapter.revoke()

  expect(sdk.opt_out_capturing).toHaveBeenCalledOnce()
  expect(sdk.reset).toHaveBeenCalledExactlyOnceWith({
    resetDeviceID: true
  })
  expect(sdk.opt_out_capturing.mock.invocationCallOrder[0]).toBeLessThan(
    sdk.reset.mock.invocationCallOrder[0] ?? 0
  )
  // The reset cleared the stored choice; the refusal holds for this page.
  expect(sdk.choice.explicit).toBe('pending')
  expect(await adapter.getStatus()).toBe('denied')
})

test('changes nothing and reads not-required outside opt-in mode', async () => {
  for (const consent of ['granted', 'memory']) {
    const adapter = await loadConsent({ consent, key: KEY })

    expect(await exercise({ adapter })).toBe('not-required')
    CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
  }
})

test('changes nothing and reads not-required without a key', async () => {
  const adapter = await loadConsent({ consent: 'opt-in' })

  expect(await exercise({ adapter })).toBe('not-required')
  expect(sdk.init).not.toHaveBeenCalled()
  CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})

test('changes nothing and reads not-required on the server', async () => {
  vi.stubGlobal('window', undefined)
  const adapter = await loadConsent({ consent: 'opt-in', key: KEY })

  expect(await exercise({ adapter })).toBe('not-required')
  expect(sdk.init).not.toHaveBeenCalled()
  CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})
