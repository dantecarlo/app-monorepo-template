import { afterEach, expect, test, vi } from 'vitest'

import {
  hasGrantRecord,
  removeGrantRecord,
  writeGrantRecord
} from '@/lib/posthog/grantRecord.adapter'

const GRANT_RECORD_KEY = 'posthog-consent:granted'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test('writes, reads and removes the grant in local storage', () => {
  expect(hasGrantRecord()).toBe(false)

  writeGrantRecord()

  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBe('true')
  expect(hasGrantRecord()).toBe(true)

  removeGrantRecord()

  expect(localStorage.getItem(GRANT_RECORD_KEY)).toBeNull()
  expect(hasGrantRecord()).toBe(false)
})

// A browser that blocks site data throws on reading window.localStorage.
test('reads no grant and throws nothing when local storage is blocked', () => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new Error('SecurityError')
  })

  expect(() => writeGrantRecord()).not.toThrow()
  expect(hasGrantRecord()).toBe(false)
  expect(() => removeGrantRecord()).not.toThrow()
})
