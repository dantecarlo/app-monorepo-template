import { expect, test } from 'vitest'

import { createR2SignedDelivery } from './createR2SignedDelivery.adapter'

const EXPIRES_IN_SECONDS = 600
const PUBLIC_BASE = 'https://assets.test'
const SIGNING_SECRET = 'r2-secret'

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
