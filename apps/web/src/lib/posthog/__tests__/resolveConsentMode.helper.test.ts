import { expect, test } from 'vitest'

import { resolveConsentMode } from '@/lib/posthog/resolveConsentMode.helper'

test('reads an absent or empty consent mode as granted', () => {
  expect(resolveConsentMode({ value: undefined })).toBe('granted')
  expect(resolveConsentMode({ value: '' })).toBe('granted')
})

test('reads each consent mode it knows', () => {
  expect(resolveConsentMode({ value: 'granted' })).toBe('granted')
  expect(resolveConsentMode({ value: 'opt-in' })).toBe('opt-in')
  expect(resolveConsentMode({ value: 'memory' })).toBe('memory')
})

test('throws a configuration error for an unknown consent mode', () => {
  expect(() => resolveConsentMode({ value: 'opt_in' })).toThrow(
    'NEXT_PUBLIC_POSTHOG_CONSENT must be one of granted, memory, opt-in; got "opt_in".'
  )
})
