import { afterEach, expect, test, vi } from 'vitest'

import { signImageUrl } from '#src/signedImageUrl.helper'

const SECRET = 'r2-secret'
const EXPIRES_IN_SECONDS = 600
const FIXED_NOW_MS = Date.parse('2026-01-01T00:00:00Z')

afterEach(() => {
  vi.restoreAllMocks()
})

test('signImageUrl keeps the query of the URL and signs it with exp', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS)
  const url = await signImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    secret: SECRET,
    url: 'https://assets.test/file.png?v=2'
  })
  expect(url).toBe(
    'https://assets.test/file.png?v=2&exp=1767226200&sig=9bc769c82df84d77a3d739a24595288aa788f19ca1d7e245a714fa1946d9a39a'
  )
})
