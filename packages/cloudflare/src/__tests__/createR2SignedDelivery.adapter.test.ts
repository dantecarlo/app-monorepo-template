import { afterEach, expect, test, vi } from 'vitest'

import { createR2SignedDelivery } from '#src/createR2SignedDelivery.adapter'

const EXPIRES_IN_SECONDS = 600
const PUBLIC_BASE = 'https://assets.test'
const SIGNING_SECRET = 'r2-secret'
const FIXED_NOW_MS = Date.parse('2026-01-01T00:00:00Z')
const SIGNED_AT_FIXED_NOW =
  'https://assets.test/file.png?exp=1767226200&sig=09213e48b43a9f219ad8f6a86e7eb3f04b43d041ad768ec7d243f0a318de877d'

afterEach(() => {
  vi.restoreAllMocks()
})

test('buildImageUrl returns raw path when no public base is configured', () => {
  const delivery = createR2SignedDelivery({ publicBaseUrl: '' })
  expect(delivery.buildImageUrl({ path: '/file.png' })).toBe('/file.png')
})

test('buildImageUrl joins the public base and path', () => {
  const delivery = createR2SignedDelivery({ publicBaseUrl: PUBLIC_BASE })
  expect(delivery.buildImageUrl({ path: 'file.png' })).toBe(
    'https://assets.test/file.png'
  )
})

test('buildSignedImageUrl falls back to public when no secret is set', async () => {
  const delivery = createR2SignedDelivery({
    publicBaseUrl: PUBLIC_BASE,
    signingSecret: undefined
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'file.png'
  })
  expect(url).not.toContain('sig=')
})

test('buildSignedImageUrl appends exp and sig when credentials are present', async () => {
  const delivery = createR2SignedDelivery({
    publicBaseUrl: PUBLIC_BASE,
    signingSecret: SIGNING_SECRET
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'file.png'
  })
  expect(url).toContain('exp=')
  expect(url).toContain('sig=')
})

test('buildSignedImageUrl signs the path and exp with the secret, at a fixed time', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS)
  const delivery = createR2SignedDelivery({
    publicBaseUrl: PUBLIC_BASE,
    signingSecret: SIGNING_SECRET
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'file.png'
  })
  expect(url).toBe(SIGNED_AT_FIXED_NOW)
})
