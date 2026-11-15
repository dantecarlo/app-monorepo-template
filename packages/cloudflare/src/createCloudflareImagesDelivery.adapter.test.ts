import { afterEach, expect, test, vi } from 'vitest'

import { createCloudflareImagesDelivery } from '#src/createCloudflareImagesDelivery.adapter'

const EXPIRES_IN_SECONDS = 300
const ACCOUNT_HASH = 'acct-hash'
const SIGNING_KEY = 'signing-key'
const PUBLIC_DELIVERY_URL =
  'https://imagedelivery.net/acct-hash/img.png/public'
const FIXED_NOW_MS = Date.parse('2026-01-01T00:00:00Z')
const SIGNED_AT_FIXED_NOW = `${PUBLIC_DELIVERY_URL}?exp=1767225900&sig=54cbb735067174a265d48bca1580dac35ad2a005a7f3e2b5844a84aa9807f70d`

afterEach(() => {
  vi.restoreAllMocks()
})

test('buildImageUrl returns raw path when no account hash is configured', () => {
  const delivery = createCloudflareImagesDelivery({
    accountHash: undefined
  })
  expect(delivery.buildImageUrl({ path: '/img.png' })).toBe('/img.png')
})

test('buildImageUrl builds a delivery url when an account hash is set', () => {
  const delivery = createCloudflareImagesDelivery({
    accountHash: ACCOUNT_HASH
  })
  expect(delivery.buildImageUrl({ path: 'img.png' })).toContain(
    ACCOUNT_HASH
  )
})

test('buildSignedImageUrl falls back to public when no signing key is set', async () => {
  const delivery = createCloudflareImagesDelivery({
    accountHash: ACCOUNT_HASH,
    signingKey: undefined
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: '/img.png'
  })
  expect(url).toBe(PUBLIC_DELIVERY_URL)
})

test('buildSignedImageUrl appends exp and sig when credentials are present', async () => {
  const delivery = createCloudflareImagesDelivery({
    accountHash: ACCOUNT_HASH,
    signingKey: SIGNING_KEY
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'img.png'
  })
  expect(url).toContain('exp=')
  expect(url).toContain('sig=')
})

test('buildSignedImageUrl signs the path and exp with the signing key, at a fixed time', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS)
  const delivery = createCloudflareImagesDelivery({
    accountHash: ACCOUNT_HASH,
    signingKey: SIGNING_KEY
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'img.png'
  })
  expect(url).toBe(SIGNED_AT_FIXED_NOW)
})

test('buildSignedImageUrl returns the raw path when no account hash is configured', async () => {
  const delivery = createCloudflareImagesDelivery({
    accountHash: undefined,
    signingKey: SIGNING_KEY
  })
  const url = await delivery.buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: '/img.png'
  })
  expect(url).toBe('/img.png')
})
