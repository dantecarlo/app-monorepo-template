import { expect, test } from 'vitest'

import { createCloudflareImagesDelivery } from './createCloudflareImagesDelivery.adapter'

const EXPIRES_IN_SECONDS = 300
const ACCOUNT_HASH = 'acct-hash'
const SIGNING_KEY = 'signing-key'

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
    path: 'img.png'
  })
  expect(url).not.toContain('sig=')
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
